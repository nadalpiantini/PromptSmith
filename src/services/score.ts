import { PromptScorer } from '../scoring/scorer.js';
import { QualityScore, ValidationResult, AnalysisResult, PromptDomain } from '../types/prompt.js';

export interface QualityBreakdown {
  overall: QualityScore;
  dimensions: {
    clarity: {
      score: number;
      factors: Array<{
        name: string;
        score: number;
        weight: number;
        description: string;
      }>;
    };
    specificity: {
      score: number;
      factors: Array<{
        name: string;
        score: number;
        weight: number;
        description: string;
      }>;
    };
    structure: {
      score: number;
      factors: Array<{
        name: string;
        score: number;
        weight: number;
        description: string;
      }>;
    };
    completeness: {
      score: number;
      factors: Array<{
        name: string;
        score: number;
        weight: number;
        description: string;
      }>;
    };
  };
  recommendations: Array<{
    dimension: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    suggestion: string;
    expectedImprovement: number;
  }>;
  historicalComparison?: {
    percentile: number;
    category: string;
    benchmarkScore: number;
  };
}

export class ScoreService {
  private scorer: PromptScorer;

  constructor() {
    this.scorer = new PromptScorer();
  }

  async calculate(
    prompt: string,
    validation: ValidationResult,
    analysis: AnalysisResult
  ): Promise<QualityScore> {
    try {
      const result = await this.scorer.calculate(prompt, validation, analysis);
      return result;
    } catch (error) {
      console.error('Score calculation failed:', error);

      // Return fallback scores if calculation fails
      return {
        overall: 0.5,
        clarity: 0.5,
        specificity: 0.5,
        structure: 0.5,
        completeness: 0.5
      };
    }
  }

  async generateBreakdown(
    prompt: string,
    analysis: AnalysisResult,
    validation: ValidationResult,
    criteria?: string[]
  ): Promise<QualityBreakdown> {
    try {
      const scoringResult = await this.scorer.calculateDetailed({
        prompt,
        domain: PromptDomain.GENERAL,
        ...(analysis && { analysis }),
        ...(validation && { validation })
      });

      // Build detailed breakdown
      const breakdown: QualityBreakdown = {
        overall: scoringResult.score,
        dimensions: {
          clarity: {
            score: scoringResult.score.clarity,
            factors: this.extractClarityFactors(scoringResult.breakdown)
          },
          specificity: {
            score: scoringResult.score.specificity,
            factors: this.extractSpecificityFactors(scoringResult.breakdown)
          },
          structure: {
            score: scoringResult.score.structure,
            factors: this.extractStructureFactors(scoringResult.breakdown)
          },
          completeness: {
            score: scoringResult.score.completeness,
            factors: this.extractCompletenessFactors(scoringResult.breakdown)
          }
        },
        recommendations: this.generateRecommendations(scoringResult, criteria)
      };

      // Add historical comparison if available
      const historicalData = await this.getHistoricalComparison(scoringResult.score);
      if (historicalData) {
        breakdown.historicalComparison = historicalData;
      }

      return breakdown;

    } catch (error) {
      console.error('Breakdown generation failed:', error);

      // Return minimal breakdown on error
      return this.generateFallbackBreakdown(prompt);
    }
  }

  async compareScores(
    scores1: QualityScore,
    scores2: QualityScore,
    labels?: [string, string]
  ): Promise<{
    winner: 0 | 1 | 'tie';
    differences: Record<string, number>;
    significance: number;
    summary: string;
  }> {
    const differences = {
      overall: scores2.overall - scores1.overall,
      clarity: scores2.clarity - scores1.clarity,
      specificity: scores2.specificity - scores1.specificity,
      structure: scores2.structure - scores1.structure,
      completeness: scores2.completeness - scores1.completeness
    };

    const overallDiff = differences.overall;
    const threshold = 0.05; // 5% threshold for significance

    let winner: 0 | 1 | 'tie';
    if (Math.abs(overallDiff) < threshold) {
      winner = 'tie';
    } else {
      winner = overallDiff > 0 ? 1 : 0;
    }

    const significance = Math.abs(overallDiff);
    const [label1, label2] = labels || ['Version 1', 'Version 2'];

    let summary: string;
    if (winner === 'tie') {
      summary = `${label1} and ${label2} have comparable quality scores (within ${threshold * 100}%).`;
    } else {
      const betterLabel = winner === 1 ? label2 : label1;
      const improvement = (significance * 100).toFixed(1);
      const strongestDimension = this.getStrongestDifference(differences);
      summary = `${betterLabel} performs ${improvement}% better overall, with strongest improvement in ${strongestDimension}.`;
    }

    return {
      winner,
      differences,
      significance,
      summary
    };
  }

  private extractClarityFactors(breakdown: any): Array<{
    name: string;
    score: number;
    weight: number;
    description: string;
  }> {
    return [
      {
        name: 'Ambiguity Level',
        score: breakdown.ambiguityScore ? 1 - breakdown.ambiguityScore : 0.8,
        weight: 0.3,
        description: 'Presence of unclear or ambiguous language'
      },
      {
        name: 'Technical Precision',
        score: breakdown.technicalTermsRatio || 0.7,
        weight: 0.25,
        description: 'Use of precise technical terminology'
      },
      {
        name: 'Readability',
        score: breakdown.readabilityScore || 0.8,
        weight: 0.25,
        description: 'Overall readability and comprehension ease'
      },
      {
        name: 'Context Clarity',
        score: breakdown.contextClarityScore || 0.75,
        weight: 0.2,
        description: 'Clear context and background information'
      }
    ];
  }

  private extractSpecificityFactors(breakdown: any): Array<{
    name: string;
    score: number;
    weight: number;
    description: string;
  }> {
    return [
      {
        name: 'Requirement Detail',
        score: breakdown.requirementDetailScore || 0.7,
        weight: 0.35,
        description: 'Level of detail in requirements specification'
      },
      {
        name: 'Constraint Definition',
        score: breakdown.constraintScore || 0.6,
        weight: 0.25,
        description: 'Clear definition of constraints and limitations'
      },
      {
        name: 'Success Criteria',
        score: breakdown.successCriteriaScore || 0.65,
        weight: 0.25,
        description: 'Specific success and completion criteria'
      },
      {
        name: 'Example Specificity',
        score: breakdown.exampleSpecificityScore || 0.7,
        weight: 0.15,
        description: 'Specific examples and use cases provided'
      }
    ];
  }

  private extractStructureFactors(breakdown: any): Array<{
    name: string;
    score: number;
    weight: number;
    description: string;
  }> {
    return [
      {
        name: 'Logical Flow',
        score: breakdown.logicalFlowScore || 0.8,
        weight: 0.3,
        description: 'Logical progression of ideas and requirements'
      },
      {
        name: 'Organization',
        score: breakdown.organizationScore || 0.75,
        weight: 0.25,
        description: 'Clear organization and sectioning'
      },
      {
        name: 'Priority Structure',
        score: breakdown.priorityScore || 0.7,
        weight: 0.25,
        description: 'Clear priority and importance structure'
      },
      {
        name: 'Format Consistency',
        score: breakdown.formatScore || 0.85,
        weight: 0.2,
        description: 'Consistent formatting and style'
      }
    ];
  }

  private extractCompletenessFactors(breakdown: any): Array<{
    name: string;
    score: number;
    weight: number;
    description: string;
  }> {
    return [
      {
        name: 'Requirement Coverage',
        score: breakdown.requirementCoverageScore || 0.7,
        weight: 0.3,
        description: 'Coverage of all necessary requirements'
      },
      {
        name: 'Context Completeness',
        score: breakdown.contextCompletenessScore || 0.75,
        weight: 0.25,
        description: 'Sufficient context and background'
      },
      {
        name: 'Output Specification',
        score: breakdown.outputSpecScore || 0.65,
        weight: 0.25,
        description: 'Clear specification of expected outputs'
      },
      {
        name: 'Edge Case Coverage',
        score: breakdown.edgeCaseScore || 0.6,
        weight: 0.2,
        description: 'Consideration of edge cases and exceptions'
      }
    ];
  }

  private generateRecommendations(
    scoringResult: any,
    criteria?: string[]
  ): Array<{
    dimension: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    suggestion: string;
    expectedImprovement: number;
  }> {
    const recommendations = [];
    const scores = scoringResult.scores;

    // Critical recommendations (score < 0.5)
    if (scores.clarity < 0.5) {
      recommendations.push({
        dimension: 'clarity',
        priority: 'critical' as const,
        suggestion: 'Remove ambiguous language and add specific definitions for technical terms',
        expectedImprovement: 0.3
      });
    }

    if (scores.completeness < 0.5) {
      recommendations.push({
        dimension: 'completeness',
        priority: 'critical' as const,
        suggestion: 'Add missing requirements, constraints, and expected outcomes',
        expectedImprovement: 0.35
      });
    }

    // High priority recommendations (score < 0.7)
    if (scores.specificity < 0.7) {
      recommendations.push({
        dimension: 'specificity',
        priority: 'high' as const,
        suggestion: 'Add more specific details, measurements, and quantifiable requirements',
        expectedImprovement: 0.2
      });
    }

    if (scores.structure < 0.7) {
      recommendations.push({
        dimension: 'structure',
        priority: 'high' as const,
        suggestion: 'Reorganize content with clear sections and logical flow',
        expectedImprovement: 0.25
      });
    }

    // Medium priority recommendations (score < 0.8)
    if (scores.clarity < 0.8 && scores.clarity >= 0.5) {
      recommendations.push({
        dimension: 'clarity',
        priority: 'medium' as const,
        suggestion: 'Replace vague terms with more precise language',
        expectedImprovement: 0.15
      });
    }

    return recommendations.slice(0, 5); // Limit to top 5 recommendations
  }

  private async getHistoricalComparison(scores: QualityScore): Promise<{
    percentile: number;
    category: string;
    benchmarkScore: number;
  } | null> {
    // This would typically query a database of historical scores
    // For now, return a simple comparison based on overall score
    try {
      let category: string;
      let benchmarkScore: number;
      let percentile: number;

      if (scores.overall >= 0.9) {
        category = 'Exceptional';
        benchmarkScore = 0.92;
        percentile = 95;
      } else if (scores.overall >= 0.8) {
        category = 'High Quality';
        benchmarkScore = 0.85;
        percentile = 80;
      } else if (scores.overall >= 0.7) {
        category = 'Good';
        benchmarkScore = 0.75;
        percentile = 65;
      } else if (scores.overall >= 0.6) {
        category = 'Average';
        benchmarkScore = 0.65;
        percentile = 50;
      } else {
        category = 'Needs Improvement';
        benchmarkScore = 0.45;
        percentile = 25;
      }

      return {
        percentile,
        category,
        benchmarkScore
      };

    } catch (error) {
      console.error('Historical comparison failed:', error);
      return null;
    }
  }

  private getStrongestDifference(differences: Record<string, number>): string {
    let maxDiff = 0;
    let strongestDimension = 'overall';

    for (const [dimension, diff] of Object.entries(differences)) {
      if (Math.abs(diff) > maxDiff) {
        maxDiff = Math.abs(diff);
        strongestDimension = dimension;
      }
    }

    return strongestDimension;
  }

  private generateFallbackBreakdown(prompt: string): QualityBreakdown {
    const fallbackScore = 0.5;

    return {
      overall: {
        overall: fallbackScore,
        clarity: fallbackScore,
        specificity: fallbackScore,
        structure: fallbackScore,
        completeness: fallbackScore
      },
      dimensions: {
        clarity: {
          score: fallbackScore,
          factors: [
            {
              name: 'Analysis Error',
              score: fallbackScore,
              weight: 1.0,
              description: 'Unable to analyze clarity due to processing error'
            }
          ]
        },
        specificity: {
          score: fallbackScore,
          factors: [
            {
              name: 'Analysis Error',
              score: fallbackScore,
              weight: 1.0,
              description: 'Unable to analyze specificity due to processing error'
            }
          ]
        },
        structure: {
          score: fallbackScore,
          factors: [
            {
              name: 'Analysis Error',
              score: fallbackScore,
              weight: 1.0,
              description: 'Unable to analyze structure due to processing error'
            }
          ]
        },
        completeness: {
          score: fallbackScore,
          factors: [
            {
              name: 'Analysis Error',
              score: fallbackScore,
              weight: 1.0,
              description: 'Unable to analyze completeness due to processing error'
            }
          ]
        }
      },
      recommendations: [
        {
          dimension: 'overall',
          priority: 'high',
          suggestion: 'Re-run analysis after resolving system errors',
          expectedImprovement: 0.0
        }
      ]
    };
  }
}