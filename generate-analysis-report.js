const fs = require('fs');
const path = require('path');

// 各種分析レポートの読み込みと統合
function generateComprehensiveAnalysis() {
  const analysis = {
    technicalDebt: [],
    refactoringTargets: [],
    complexityIssues: [],
    largeFiles: []
  };

  // ESLintレポートの分析
  try {
    const eslintReport = JSON.parse(fs.readFileSync('eslint-report.json', 'utf8'));
    
    eslintReport.forEach(file => {
      if (file.errorCount > 5 || file.warningCount > 10) {
        analysis.technicalDebt.push({
          file: file.filePath,
          errorCount: file.errorCount,
          warningCount: file.warningCount
        });
      }
    });
  } catch (error) {
    console.error('ESLint報告書の読み込みエラー:', error);
  }

  // 依存関係グラフの分析
  try {
    const dependencyGraph = JSON.parse(fs.readFileSync('dependency-graph.json', 'utf8'));
    
    Object.entries(dependencyGraph).forEach(([module, dependencies]) => {
      if (dependencies.length > 10) {
        analysis.refactoringTargets.push({
          module,
          dependencyCount: dependencies.length
        });
      }
    });
  } catch (error) {
    console.error('依存関係グラフの読み込みエラー:', error);
  }

  // 大きなファイルの分析
  try {
    const largeFiles = fs.readFileSync('large-files.txt', 'utf8').split('\n');
    
    largeFiles.forEach(line => {
      const match = line.match(/(\d+)\s+(.+)/);
      if (match && parseInt(match[1]) > 300) {
        analysis.largeFiles.push({
          file: match[2],
          lineCount: parseInt(match[1])
        });
      }
    });
  } catch (error) {
    console.error('大きなファイルリストの読み込みエラー:', error);
  }

  // 分析結果をJSONファイルに出力
  fs.writeFileSync('comprehensive-analysis.json', JSON.stringify(analysis, null, 2));
  console.log('分析レポートを生成しました: comprehensive-analysis.json');
}

generateComprehensiveAnalysis();
