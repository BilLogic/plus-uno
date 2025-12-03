import{a as r}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const u={title:"Components/CompetencyPill",tags:["autodocs"]},n={render:()=>{const e=document.createElement("div");return e.style.display="flex",e.style.flexWrap="wrap",e.style.gap="var(--size-card-gap-md)",["Social-Emotional","Mastering Content","Advocacy","Relationships","Technology Tools"].forEach(a=>{const c=r.createSuperCompPillDiv(a,!1);e.appendChild(c)}),e}},t={render:e=>{const o=document.createElement("div"),a=r.createSuperCompPillDiv(e.competencyArea,e.abbreviate);return o.appendChild(a),o},argTypes:{competencyArea:{control:"select",options:["Social-Emotional","Mastering Content","Advocacy","Relationships","Technology Tools"],description:"Competency area"},abbreviate:{control:"boolean",description:"Abbreviate text"}},args:{competencyArea:"Social-Emotional",abbreviate:!1}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.gap = 'var(--size-card-gap-md)';
    const competencyAreas = ['Social-Emotional', 'Mastering Content', 'Advocacy', 'Relationships', 'Technology Tools'];
    competencyAreas.forEach(area => {
      const pill = PlusSmartComponents.createSuperCompPillDiv(area, false);
      container.appendChild(pill);
    });
    return container;
  }
}`,...n.parameters?.docs?.source},description:{story:`All Variants
Shows all competency pill variants`,...n.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');
    const pill = PlusSmartComponents.createSuperCompPillDiv(args.competencyArea, args.abbreviate);
    container.appendChild(pill);
    return container;
  },
  argTypes: {
    competencyArea: {
      control: 'select',
      options: ['Social-Emotional', 'Mastering Content', 'Advocacy', 'Relationships', 'Technology Tools'],
      description: 'Competency area'
    },
    abbreviate: {
      control: 'boolean',
      description: 'Abbreviate text'
    }
  },
  args: {
    competencyArea: 'Social-Emotional',
    abbreviate: false
  }
}`,...t.parameters?.docs?.source},description:{story:`Interactive Competency Pill
Interactive playground for testing competency pill variations`,...t.parameters?.docs?.description}}};const g=["AllVariants","Interactive"];export{n as AllVariants,t as Interactive,g as __namedExportsOrder,u as default};
