import React, { useState, useMemo, useEffect } from 'react';
import { calculateDeterminant, type Step, type MatrixAnalysis } from './matrixLogic';
import './matrixCalculator.css';

const createEmptyMatrix = (size: number): string[][] => {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => ''));
};

const getOrdinal = (n: number): string => {
  if (n === undefined || isNaN(n)) return "1st";
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return n + "st";
  if (j === 2 && k !== 12) return n + "nd";
  if (j === 3 && k !== 13) return n + "rd";
  return n + "th";
};

const matrixToLatex = (matrix: number[][]): string => {
    return `\\begin{bmatrix} ${matrix.map(row => row.join(' & ')).join(' \\\\ ')} \\end{bmatrix}`;
};

interface ExpansionGroup {
  type: 'group';
  expand: Step & { type: 'expand' };
  children: (Step | ExpansionGroup)[];
  final: Step & { type: 'final_sum' };
}
type RenderItem = Step | ExpansionGroup;

export default function MatrixCalculator() {
  const [screen, setScreen] = useState<"home" | "calculator">("home");
  const [activeChip, setActiveChip] = useState<number>(0);
  const [darkMode, setDarkMode] = useState<boolean>(false);
    useEffect(() => {
        document.body.classList.toggle("dark-mode", darkMode);
    }, [darkMode]);


  const [size, setSize] = useState<number>(3);
  const [matrix, setMatrix] = useState<string[][]>(createEmptyMatrix(3));
  const [result, setResult] = useState<MatrixAnalysis | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showSteps, setShowSteps] = useState(false);

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10);
    setSize(newSize);
    setMatrix(createEmptyMatrix(newSize));
    setResult(null);
    setShowSteps(false);
  };

  const handleMatrixChange = (row: number, col: number, value: string) => {
    const newMatrix = matrix.map((r, i) =>
      i === row ? r.map((c, j) => (j === col ? value : c)) : r
    );
    setMatrix(newMatrix);
  };

  const handleCalculate = () => {
    setIsCalculating(true);
    setResult(null);
    setShowSteps(false);

    setTimeout(() => {
        const numericMatrix = matrix.map(row =>
            row.map(cell => {
              const val = parseFloat(cell);
              return isNaN(val) ? 0 : val;
            })
          );
      
          try {
            const calculationResult = calculateDeterminant(numericMatrix);
            setResult(calculationResult);
          } catch (error) {
            alert("Error calculating determinant");
          } finally {
            setIsCalculating(false);
          }
    }, 100);
  };

  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrintPdf = () => {
      setShowSteps(true);
      setTimeout(() => {
          window.print();
      }, 300);
  };

  const handleExportLatex = () => {
      if (!result) return;
      let latex = `\\section*{Determinant Calculation}\n\\[ \\det(A) = ${result.determinant} \\]\n\\subsection*{Steps}\n\\begin{itemize}\n`;
      
      result.steps.forEach(step => {
          if (step.type === 'start') {
              latex += `\\item Input Matrix: \\[ ${matrixToLatex(step.matrix)} \\]\n`;
          } else if (step.type === 'expand') {
              latex += `\\item Expanded along ${step.source} ${step.index + 1}.\n`;
          } else if (step.type === 'calc_2x2') {
              latex += `\\item 2x2 Determinant: ${step.result}\n`;
          } else if (step.type === 'final_sum') {
              latex += `\\item Final Sum: ${step.result}\n`;
          }
      });
      latex += `\\end{itemize}`;

      navigator.clipboard.writeText(latex).then(() => alert("LaTeX copied to clipboard!"));
  };

  const startCalculator = (initialSize: number = 3) => {
    setSize(initialSize);
    setMatrix(createEmptyMatrix(initialSize));
    setResult(null);
    setIsCalculating(false);
    setShowSteps(false);
    setScreen("calculator");
  };

  const goHomeAndReset = () => {
    setSize(3);
    setMatrix(createEmptyMatrix(3));
    setResult(null);
    setIsCalculating(false);
    setShowSteps(false);
    setScreen("home");
  };


  const groupedSteps = useMemo(() => {
    if (!result || !result.steps) return [];
    
    const root: RenderItem[] = [];
    const stack: RenderItem[][] = [root];

    result.steps.forEach(step => {
        const currentList = stack[stack.length - 1];

        if (step.type === 'expand') {
            const group: ExpansionGroup = { type: 'group', expand: step, children: [], final: null as any };
            currentList.push(group);
            stack.push(group.children);
        } else if (step.type === 'final_sum') {
            stack.pop();
            const parentList = stack[stack.length - 1];
            const group = parentList[parentList.length - 1] as ExpansionGroup;
            if (group && group.type === 'group') {
                group.final = step;
            } else {
                parentList.push(step);
            }
        } else {
            currentList.push(step);
        }
    });
    return root;
  }, [result]);

  const renderMiniMatrix = (m: number[][], highlightRow: number = -1, highlightCol: number = -1) => (
    <div className="mini-matrix-wrapper">
      <table className="mini-matrix">
        <tbody>
          {m.map((row, i) => (
            <tr key={i}>
              {row.map((val, j) => {
                const isHighlighted = i === highlightRow || j === highlightCol;
                return (
                  <td key={j} className={`mini-cell ${isHighlighted ? 'highlighted' : ''}`}>
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCrossedMatrix = (m: number[][], crossRow: number, crossCol: number) => (
    <div className="mini-matrix-wrapper">
      <table className="mini-matrix">
        <tbody>
          {m.map((row, i) => (
            <tr key={i}>
              {row.map((val, j) => {
                const isCrossed = i === crossRow || j === crossCol;
                return (
                  <td key={j} className={`mini-cell ${isCrossed ? 'cell-red' : 'cell-green'}`}>
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderStep = (item: RenderItem, index: number) => {
    if (item.type === 'group') {
        const { expand, children, final } = item;
        const isRow = expand.source === 'row';
        const safeIndex = expand.index !== undefined ? expand.index : 0;
        const ordinalText = getOrdinal(safeIndex + 1);

        return (
            <div key={`group-${index}`} className="step-card">
                <h4 className="step-title">Cofactor Expansion Process</h4>

                <div className="sub-step">
                    <strong className="sub-step-title">1. Choose a Row or Column</strong>
                    <p className="sub-step-desc">
                        Select any row or column to expand along. Choose one with the most zeros to simplify calculations.
                    </p>
                    <div className="selection-box">
                        {expand.matrix && renderMiniMatrix(
                            expand.matrix,
                            isRow ? safeIndex : -1,
                            isRow ? -1 : safeIndex
                        )}
                        <p style={{margin: 0}}>
                            We selected the <strong>{ordinalText} {isRow ? 'Row' : 'Column'}</strong>.
                        </p>
                    </div>
                </div>

                <div className="sub-step">
                    <strong className="sub-step-title">2. Determine the Sign Pattern</strong>
                    <p className="sub-step-desc">
                        Use the formula <code style={{background: '#eee', padding: '2px 4px'}}>(-1)<sup>i+j</sup></code> for each element.
                    </p>
                    <div className="sign-box-container">
                        {expand.terms.map((t, i) => (
                            <div key={i} className="sign-box">
                                <strong>{t.value}</strong> &rarr; <strong>{t.sign > 0 ? 'Positive (+)' : 'Negative (-)'}</strong>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="sub-step">
                     <strong className="sub-step-title">3. Find the Minor (Smaller Matrix)</strong>
                     <p className="sub-step-desc">
                        For each element, "cross out" its row and column to get a smaller matrix.
                     </p>
                     <div style={{display: 'flex', flexWrap: 'wrap', gap: '15px'}}>
                        {expand.terms.map((t, i) => {
                            const rowIdx = isRow ? safeIndex : i;
                            const colIdx = isRow ? i : safeIndex;
                            return (
                                <div key={i} style={{textAlign: 'center'}}>
                                    {renderCrossedMatrix(expand.matrix, rowIdx, colIdx)}
                                    <div style={{fontSize: '0.85em', marginTop: '5px', color: '#666'}}>Minor for {t.value}</div>
                                </div>
                            );
                        })}
                     </div>
                </div>

                <div>
                    <strong className="sub-step-title">4. Calculate the Determinant of the Minor</strong>
                    <p className="sub-step-desc">
                        Find the determinant of that smaller submatrix.
                    </p>
                    <div className="formula-box">
                        <strong style={{color: '#e65100', display: 'block', marginBottom: '10px'}}>Expansion Formula:</strong>
                        
                        <div className="formula-math">
                            <span style={{marginRight: '10px'}}>det(A) = </span>
                            {expand.terms.map((t, i) => (
                                <React.Fragment key={i}>
                                    {i > 0 && <span style={{margin: '0 8px', fontWeight: 'bold'}}>+</span>}
                                    <span className="formula-term">
                                        <span style={{fontWeight: 'bold', color: '#d32f2f'}}>{t.sign > 0 ? '' : '-'}{t.value}</span>
                                        <span style={{margin: '0 6px'}}>&times;</span>
                                        <span style={{fontStyle: 'italic', marginRight: '4px'}}>det</span>
                                        {renderMiniMatrix(t.minor)}
                                    </span>
                                </React.Fragment>
                            ))}
                        </div>
                    </div>
                </div>

                {children.length > 0 && (
                    <div className="nested-steps">
                        {children.map((child, i) => renderStep(child, i))}
                    </div>
                )}

                {final && (
                    <div className="final-sum-section">
                        <strong className="sub-step-title">5. Multiply and Sum the Results</strong>
                         <p className="sub-step-desc" style={{marginBottom: '15px'}}>
                            Multiply the element by its sign and the determinant of its minor, then sum them up.
                         </p>
                         
                         <div className="term-breakdown-box">
                            {final.terms && final.terms.map((t, i) => (
                               <div key={i} className="breakdown-row">
                                   <span className="val-color">{t.value}</span> 
                                   <span className="label-small"></span>
                                   
                                   <span className="op-color">&times;</span>

                                   <span className="sign-color">{t.sign > 0 ? '+1' : '-1'}</span> 
                                   <span className="label-small"></span>
                                   
                                   <span className="op-color">&times;</span>

                                   <span className="det-color">{t.det}</span> 
                                   <span className="label-small"></span>

                                   <span style={{margin: '0 15px', color: '#333'}}>=</span> 
                                   <strong>{t.value * t.sign * t.det}</strong>
                               </div>
                            ))}
                         </div>

                         <div className="final-equation-box">
                             <div style={{marginBottom: '10px'}}>
                                <span style={{color: '#555', fontSize: '0.8em', marginRight: '10px', fontFamily: 'sans-serif'}}>Determinant:</span>
                                {final.terms && final.terms.map((t, i) => {
                                    const termValue = t.value * t.sign * t.det;
                                    return (
                                        <span key={i}>
                                            {i > 0 ? ' + ' : ''}
                                            {termValue}
                                        </span>
                                    );
                                })}
                                {' = '}
                                <strong>{final.result}</strong>
                             </div>
                         </div>
                    </div>
                )}
            </div>
        );
    }

    const step = item as Step;
    switch (step.type) {
      case 'start':
        return (
            <div key={index} className="step-container">
               <h3 className="section-title">Step-By-Step Solution</h3>
               <div className="setup-row">
                  <span className="setup-label">Finding determinant of:</span>
                  {renderMiniMatrix(step.matrix)}
               </div>
            </div>
        );

      case 'calc_2x2':
        return (
            <div key={index} style={{ marginLeft: '20px', padding: '10px', borderLeft: '2px solid #ddd', marginBottom: '10px', color: '#666' }}>
                <div style={{fontSize: '0.9em'}}>
                    <strong>Sub-step:</strong> Calculating determinant of 2x2 minor:
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9em', marginTop: '5px' }}>
                    {renderMiniMatrix(step.matrix)} 
                    <span>= ({step.matrix[0][0]} &times; {step.matrix[1][1]}) - ({step.matrix[0][1]} &times; {step.matrix[1][0]})</span>
                    <span>= <strong>{step.result}</strong></span>
                </div>
            </div>
        );

      default:
        return null;
    }
  };

  if (screen === "home") {
    return (
      <div className="calculator-container home-page">
        
        <button
            className="floating-theme"
            onClick={() => setDarkMode(!darkMode)}

            type="button"
          >
            {darkMode ? "☀️" : "🌙"}
          </button> 

        <div className="home-card home-simple">
        
          <div className="home-blobs">
            <span className="blob b1"></span>
            <span className="blob b2"></span>
            <span className="blob b3"></span>
            <span className="blob b4"></span>
            <span className="blob b5"></span>
            <span className="blob b6"></span>
          </div>

          <h1 className="home-main-title">
            Determinant Calculator <span className="title-sparkle">✦</span>
          </h1>

          <div className="home-chips">
            {[
              "Step-by-step Solution",
              "Singular / Non-singular",
              "Export to LaTeX",
              "Save as PDF",
            ].map((text, i) => (
              <button
                key={i}
                className={`home-chip ${activeChip === i ? "active" : ""}`}
                onClick={() => setActiveChip(i)}
                type="button"
              >
                {text}
              </button>
            ))}
          </div>

          <button className="calculate-button home-start" onClick={() => startCalculator(3)}>
            Start Calculator 
          </button>

          <div className="home-mini-preview">
            {activeChip === 0 && "Show the full cofactor expansion process beautifully."}
            {activeChip === 1 && "Instantly tells if the matrix is singular or not."}
            {activeChip === 2 && "Copy a LaTeX version for your reports."}
            {activeChip === 3 && "Print-ready format for submission."}
          </div>

          <footer className="app-footer home-footer">
            <p>De Joya • Balan • Esquejo • Nepomuceno • Omela</p>
          </footer>
        </div>
      </div>
    );
  }



  return (
    <div className="calculator-container">

      <button
            className="floating-theme"
            onClick={() => setDarkMode(!darkMode)}

            type="button"
          >
            {darkMode ? "☀️" : "🌙"}
          </button> 

      <div className="header-card header-row">
        <button
          className="home-icon-btn"
          onClick={goHomeAndReset}
          type="button"
        >
          ← Home
        </button>

        <div className="header-text">
          <h1 className="calculator-title">Determinant Calculator</h1>
          <p className="calculator-subtitle">
            A step-by-step determinant calculator using cofactor expansion.
          </p>
        </div>

        <div className="header-spacer"></div>
      </div>
      
      <div className="input-card">
        <div className="controls-container">
            <label className="size-label">Matrix Size: </label>
            <select value={size} onChange={handleSizeChange} className="size-select">
            {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                <option key={n} value={n}>{n} x {n}</option>
            ))}
            </select>
        </div>

        <div className="matrix-input-wrapper">
            <div 
                className="matrix-grid"
                style={{ 
                   gridTemplateColumns: `30px repeat(${size}, 60px)` 
                }}
            >
                <div></div>
                {Array.from({length: size}).map((_, j) => (
                    <div key={`head-${j}`} className="grid-header-label">
                        {j + 1}
                    </div>
                ))}

                {matrix.map((row, i) => (
                    <React.Fragment key={`row-${i}`}>
                        <div className="grid-row-label">
                            {i + 1}
                        </div>
                        {row.map((cell, j) => (
                            <input
                            key={`${i}-${j}`}
                            type="number"
                            className="matrix-input"
                            value={cell}
                            onChange={(e) => handleMatrixChange(i, j, e.target.value)}
                            />
                        ))}
                    </React.Fragment>
                ))}
            </div>
        </div>

        <div className="button-row">
          <button 
            onClick={handleCalculate}
            disabled={isCalculating}
            className="calculate-button"
          >
            {isCalculating ? 'Calculating...' : 'Calculate Determinant'}
          </button>

          <button
            className="secondary-button"
            onClick={() => {
              setMatrix(createEmptyMatrix(size));
              setResult(null);
              setShowSteps(false);
            }}
            disabled={isCalculating}
          >
            Clear All
          </button>
        </div>  
      </div>

      {result && (
        <div className="results-section">
          
          <div className={`result-card ${result.isSingular ? "singular" : "non-singular"}`}>
            <div className="result-header">
              <div className="result-line">
                <span className="final-answer-label">Determinant: </span>
                <span className="final-answer-value">{result.determinant}</span>
              </div>

              <span className={`status-badge ${result.isSingular ? "bad" : "good"}`}>
                {result.isSingular ? "Singular" : "Non-singular"}
              </span>
            </div>

            <div className="result-message">{result.message}</div>
          </div>
        
          <div className="action-buttons">
              <button className="secondary-button" onClick={() => setShowSteps(!showSteps)}>
                  {showSteps ? "Hide Steps" : "Show Solution"}
              </button>
              <button className="secondary-button" onClick={handlePrintPdf}>
                  Save as PDF
              </button>
              <button className="secondary-button" onClick={handleExportLatex}>
                  Export to LaTeX
              </button>
          </div>

          {showSteps && (
             <div className="steps-wrapper">
                {groupedSteps.length > 0 ? groupedSteps.map((s, i) => renderStep(s, i)) : <p>Steps omitted for performance.</p>}
             </div>
          )}
          
          <button className="floating-backtop" onClick={handleBackToTop}>
            ↑ Top
          </button>
        </div>
      )}

      <footer className="app-footer">
        <p>De Joya • Balan • Esquejo • Nepomuceno • Omela </p>
      </footer>
    </div>
  );
}