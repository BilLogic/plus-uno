const a={title:"Components/Input/Types",tags:["autodocs"],parameters:{docs:{description:{component:`Input Types Stories
Input type variants organized under "Types" subcategory`}}}},t={render:()=>{const e=document.createElement("input");return e.type="text",e.className="plus-text-field body2-txt",e.placeholder="Enter text...",e}},r={render:()=>{const e=document.createElement("textarea");return e.className="plus-textarea body2-txt",e.placeholder="Enter text...",e.rows=4,e}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'plus-text-field body2-txt';
    input.placeholder = 'Enter text...';
    return input;
  }
}`,...t.parameters?.docs?.source},description:{story:"Text Input",...t.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const textarea = document.createElement('textarea');
    textarea.className = 'plus-textarea body2-txt';
    textarea.placeholder = 'Enter text...';
    textarea.rows = 4;
    return textarea;
  }
}`,...r.parameters?.docs?.source},description:{story:"Textarea",...r.parameters?.docs?.description}}};const n=["TextInput","Textarea"];export{t as TextInput,r as Textarea,n as __namedExportsOrder,a as default};
