import {test} from 'node:test';
import assert from 'node:assert/strict';
import {renderCommunityMarkdown} from '../src/lib/community';
import {renderAnswerText} from '../src/lib/prose';
import {parseHTML} from 'linkedom';

test('community answers render inline and display math while retaining Markdown',()=>{
 const html=renderCommunityMarkdown('**Scale** $\\sqrt{d_k}$\n\n$$\n\\frac{QK^T}{\\sqrt{d_k}}\n$$');
 assert.match(html,/<strong>Scale<\/strong>/);
 assert.match(html,/class="katex"/);
 assert.match(html,/class="katex-display"/);
 assert.match(html,/<math/);
});

test('math rendering never enables executable HTML or trusted LaTeX commands',()=>{
 const html=renderCommunityMarkdown('<script>alert(1)</script>\n\n[x](javascript:alert) $\\href{javascript:alert(1)}{x}$');
 assert.doesNotMatch(html,/<script|href="javascript:|onclick=/);
});

test('JSON answers preserve literal prose and paragraph breaks alongside math',()=>{
 const value='Use Q_K_V, **literal**, <script>x</script> and a < b.\nNext $\\sqrt{d_k}$.\n\n$$\nx^2\n$$';
 const html=renderAnswerText(value),document=parseHTML(html).document;
 assert.equal(document.querySelector('p')?.textContent,'Use Q_K_V, **literal**, <script>x</script> and a < b.');
 assert.equal(document.querySelectorAll('p').length,2);
 assert.equal(document.querySelectorAll('.katex').length,2);
 assert.equal(document.querySelectorAll('.katex-display').length,1);
 assert.doesNotMatch(html,/<script|<strong|<em>/);
});

test('invalid LaTeX fails the build instead of silently publishing a broken formula',()=>{
 for(const render of [renderAnswerText,renderCommunityMarkdown])assert.throws(()=>render('$\\notARealCommand{x}$'),/Invalid answer formula/);
});

test('literal code and unmatched dollar signs stay readable',()=>{
 const html=renderAnswerText('Cost: $5.\n\nCode: `$x$`.\nUse Q_K_V.');
 assert.doesNotMatch(html,/class="katex"/);
 assert.equal(parseHTML(html).document.querySelector('p')?.textContent,'Cost: $5.');
});

test('existing currency examples remain literal and may coexist with math',()=>{
 const value='Prices are US$1、US$4, NT$120 and NT$110.\nCost $2 per million: $0.068 and $0.016. Scale $\\sqrt{d_k}$.';
 const html=renderAnswerText(value),document=parseHTML(html).document;
 assert.equal(document.querySelectorAll('.katex').length,1);
 assert.equal(document.querySelector('p')?.textContent,'Prices are US$1、US$4, NT$120 and NT$110.');
 assert.match(document.querySelectorAll('p')[1].textContent!,/Cost \$2 per million: \$0.068 and \$0.016\./);
});
