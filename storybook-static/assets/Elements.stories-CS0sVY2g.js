import{j as e}from"./jsx-runtime-u17CrQMm.js";import"./iframe-CwPMOv9C.js";import"./preload-helper-PPVm8Dsz.js";const o=({size:t=228,segments:n=[],value:a,label:l})=>e.jsxs("div",{style:{width:t,height:t,position:"relative"},children:[e.jsx("svg",{width:"100%",height:"100%",viewBox:`0 0 ${t} ${t}`,fill:"none",children:n.map((r,s)=>e.jsx("path",{d:r.path,fill:r.color},s))}),e.jsxs("div",{className:"position-absolute top-50 start-50 translate-middle text-center",children:[e.jsx("div",{className:"h1 fw-bold m-0",children:a}),e.jsx("div",{className:"small text-muted",children:l})]})]});o.__docgenInfo={description:"",methods:[],displayName:"DonutChart",props:{size:{defaultValue:{value:"228",computed:!1},required:!1},segments:{defaultValue:{value:"[]",computed:!1},required:!1}}};const d=({data:t,dates:n,yLabels:a=["100%","75%","50%","25%","0%"]})=>e.jsxs("div",{className:"d-flex w-100",style:{height:"207px"},children:[e.jsx("div",{className:"d-flex flex-column justify-content-between align-items-end pe-2",style:{width:"40px"},children:a.map((l,r)=>e.jsx("div",{className:"text-muted small",style:{fontSize:"10px"},children:l},r))}),e.jsxs("div",{className:"flex-grow-1 position-relative border-start border-bottom",children:[[0,1,2,3].map(l=>e.jsx("div",{className:"position-absolute w-100 border-top",style:{top:`${l*25}%`,opacity:.1}},l)),e.jsx("div",{className:"d-flex justify-content-around align-items-end h-100 px-2",children:t.map((l,r)=>e.jsxs("div",{className:"d-flex flex-column align-items-center",style:{width:"34px"},children:[e.jsx("div",{className:"d-flex flex-column w-100",style:{height:"198px",justifyContent:"flex-end"},children:l.segments.map((s,c)=>e.jsx("div",{className:"d-flex align-items-center justify-content-center text-white small",style:{height:s.height,backgroundColor:s.color,color:s.textColor||"white",fontSize:"10px",borderRadius:"2px"},children:s.value},c))}),e.jsx("div",{className:"text-muted small mt-2 text-nowrap",style:{fontSize:"10px"},children:n[r]})]},r))})]})]});d.__docgenInfo={description:"",methods:[],displayName:"StackedBarChart",props:{yLabels:{defaultValue:{value:"['100%', '75%', '50%', '25%', '0%']",computed:!1},required:!1}}};const h=({data:t})=>e.jsx("div",{className:"d-flex gap-1 align-items-start",children:t.map((n,a)=>e.jsxs("div",{className:"d-flex flex-column gap-1 align-items-center",children:[e.jsxs("div",{className:"position-relative",style:{width:"6px",height:"80px"},children:[e.jsx("div",{className:"w-100 h-100 bg-light rounded-pill"}),e.jsx("div",{className:"position-absolute bottom-0 w-100 rounded-pill",style:{height:n.height,backgroundColor:n.color}})]}),e.jsx("div",{className:"small fw-light",style:{fontSize:"10px",color:n.color},children:n.letter})]},a))});h.__docgenInfo={description:"",methods:[],displayName:"SmartBarChart"};const m={title:"Specs/Admin/Tutor Admin/Elements",tags:["autodocs"]},i={render:()=>e.jsxs("div",{style:{display:"flex",flexDirection:"column",gap:"20px"},children:[e.jsxs("div",{children:[e.jsx("h3",{children:"Pie Chart"}),e.jsx("div",{style:{width:"300px",height:"300px"},children:e.jsx(o,{data:[{value:30,color:"var(--bs-success)"},{value:20,color:"var(--bs-warning)"},{value:50,color:"var(--bs-danger)"}],total:100})})]}),e.jsxs("div",{children:[e.jsx("h3",{children:"Bar Chart"}),e.jsx("div",{style:{width:"500px",height:"300px"},children:e.jsx(d,{dates:["Mon","Tue","Wed","Thu","Fri"],data:[{segments:[{value:10,height:"50%",color:"blue"},{value:5,height:"25%",color:"red"}]},{segments:[{value:15,height:"75%",color:"blue"},{value:2,height:"10%",color:"red"}]},{segments:[{value:8,height:"40%",color:"blue"},{value:8,height:"40%",color:"red"}]},{segments:[{value:12,height:"60%",color:"blue"},{value:4,height:"20%",color:"red"}]},{segments:[{value:18,height:"90%",color:"blue"},{value:1,height:"5%",color:"red"}]}]})})]}),e.jsxs("div",{children:[e.jsx("h3",{children:"Line Chart (Smart)"}),e.jsx("div",{style:{width:"300px",height:"200px"},children:e.jsx(h,{data:[{letter:"S",height:"60%",color:"var(--bs-info)"},{letter:"M",height:"80%",color:"var(--bs-primary)"},{letter:"A",height:"40%",color:"var(--bs-secondary)"},{letter:"R",height:"90%",color:"var(--bs-danger)"},{letter:"T",height:"70%",color:"var(--bs-warning)"}]})})]})]})};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  render: () => <div style={{
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  }}>
            <div>
                <h3>Pie Chart</h3>
                <div style={{
        width: '300px',
        height: '300px'
      }}>
                    <DonutChart data={[{
          value: 30,
          color: 'var(--bs-success)'
        }, {
          value: 20,
          color: 'var(--bs-warning)'
        }, {
          value: 50,
          color: 'var(--bs-danger)'
        }]} total={100} />
                </div>
            </div>
            <div>
                <h3>Bar Chart</h3>
                <div style={{
        width: '500px',
        height: '300px'
      }}>
                    <StackedBarChart dates={['Mon', 'Tue', 'Wed', 'Thu', 'Fri']} data={[{
          segments: [{
            value: 10,
            height: '50%',
            color: 'blue'
          }, {
            value: 5,
            height: '25%',
            color: 'red'
          }]
        }, {
          segments: [{
            value: 15,
            height: '75%',
            color: 'blue'
          }, {
            value: 2,
            height: '10%',
            color: 'red'
          }]
        }, {
          segments: [{
            value: 8,
            height: '40%',
            color: 'blue'
          }, {
            value: 8,
            height: '40%',
            color: 'red'
          }]
        }, {
          segments: [{
            value: 12,
            height: '60%',
            color: 'blue'
          }, {
            value: 4,
            height: '20%',
            color: 'red'
          }]
        }, {
          segments: [{
            value: 18,
            height: '90%',
            color: 'blue'
          }, {
            value: 1,
            height: '5%',
            color: 'red'
          }]
        }]} />
                </div>
            </div>
            <div>
                <h3>Line Chart (Smart)</h3>
                <div style={{
        width: '300px',
        height: '200px'
      }}>
                    <SmartBarChart data={[{
          letter: 'S',
          height: '60%',
          color: 'var(--bs-info)'
        }, {
          letter: 'M',
          height: '80%',
          color: 'var(--bs-primary)'
        }, {
          letter: 'A',
          height: '40%',
          color: 'var(--bs-secondary)'
        }, {
          letter: 'R',
          height: '90%',
          color: 'var(--bs-danger)'
        }, {
          letter: 'T',
          height: '70%',
          color: 'var(--bs-warning)'
        }]} />
                </div>
            </div>
        </div>
}`,...i.parameters?.docs?.source}}};const g=["Graphs"];export{i as Graphs,g as __namedExportsOrder,m as default};
