import React, { useState } from 'react';
import './Calculator.css';

export default function Calculator({ onSecretCode }) {
    const [input, setInput] = useState('');
    const [result, setResult] = useState('');

    const append = (value) => {
        const newInput = input + value;
        setInput(newInput);

        // Secret code works even if '=' is first
        if (newInput === '=911#') {
            onSecretCode && onSecretCode();
            setInput('');
            setResult('');
        }

        // If '=' is typed at the end, evaluate automatically
        if (newInput.endsWith('=') && !newInput.includes('#')) {
            evaluate(newInput.slice(0, -1)); // remove '=' before evaluating
        }
    };

    const clear = () => {
        setInput('');
        setResult('');
    };

    const backspace = () => {
        setInput((s) => s.slice(0, -1));
    };

    const evaluate = (exprInput) => {
        const expr = (exprInput ?? input)
            .replace(/[#=]/g, '')
            .replace(/×/g, '*')
            .replace(/÷/g, '/');

        if (!expr) return;

        if (!/^[0-9+\-*/().\s]+$/.test(expr)) {
            setResult('Invalid chars');
            return;
        }

        try {
            // eslint-disable-next-line no-new-func
            const res = Function(`return (${expr})`)();
            setResult(String(res));
            setInput(String(res));
        } catch (e) {
            setResult('Error');
        }
    };

    const buttons = [
        { label: 'C', action: clear, type: 'action' },
        { label: 'DEL', action: backspace, type: 'action' },
        { label: '÷', value: '÷', type: 'operator' },
        { label: '×', value: '×', type: 'operator' },
        { label: '7', value: '7' },
        { label: '8', value: '8' },
        { label: '9', value: '9' },
        { label: '-', value: '-', type: 'operator' },
        { label: '4', value: '4' },
        { label: '5', value: '5' },
        { label: '6', value: '6' },
        { label: '+', value: '+', type: 'operator' },
        { label: '1', value: '1' },
        { label: '2', value: '2' },
        { label: '3', value: '3' },
        { label: '=', value: '=' },   // '=' now treated as input
        { label: '#', value: '#' },
        { label: '0', value: '0' },
        { label: '.', value: '.' },
    ];

    return (
        <div className="calculator" role="group" aria-label="Calculator">
            <div className="display" aria-live="polite">
                <div className="display__input">{input || '0'}</div>
                <div className="display__result">{result ? `= ${result}` : ''}</div>
            </div>

            <div className="keys">
                {buttons.map((b, i) => {
                    const key = `${b.label}-${i}`;
                    return (
                        <button
                            key={key}
                            className={`btn ${b.type ? 'btn--operator' : ''} ${b.action ? `btn--${b.type || 'action'}` : ''}`}
                            onClick={() => (b.action ? b.action() : append(b.value))}
                            aria-label={b.label}
                        >
                            {b.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}