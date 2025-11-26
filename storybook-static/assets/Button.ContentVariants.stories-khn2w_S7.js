import{P as i}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const f={title:"Components/Button/Content Variants",tags:["autodocs"]},n={render:()=>{const t=document.createElement("div");return t.style.display="flex",t.style.flexWrap="wrap",t.style.gap="var(--size-card-gap-md)",t.style.flexDirection="column",[{icon:"check",position:"left",text:"Left Icon"},{icon:"arrow-right",position:"right",text:"Right Icon"},{icon:"save",position:"left",text:"Save"},{icon:"download",position:"left",text:"Download"}].forEach(e=>{const o=i.createButton({btnText:e.text,btnStyle:"primary",btnFill:"filled",btnSize:"default",icon:e.icon,iconPosition:e.position});t.appendChild(o)}),t}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-md)';
    container.style.flexDirection = 'column';
    const examples = [{
      icon: 'check',
      position: 'left',
      text: 'Left Icon'
    }, {
      icon: 'arrow-right',
      position: 'right',
      text: 'Right Icon'
    }, {
      icon: 'save',
      position: 'left',
      text: 'Save'
    }, {
      icon: 'download',
      position: 'left',
      text: 'Download'
    }];
    examples.forEach(example => {
      const button = PlusInterface.createButton({
        btnText: example.text,
        btnStyle: 'primary',
        btnFill: 'filled',
        btnSize: 'default',
        icon: example.icon,
        iconPosition: example.position
      });
      container.appendChild(button);
    });
    return container;
  }
}`,...n.parameters?.docs?.source},description:{story:"Buttons with Icons",...n.parameters?.docs?.description}}};const u=["WithIcons"];export{n as WithIcons,u as __namedExportsOrder,f as default};
