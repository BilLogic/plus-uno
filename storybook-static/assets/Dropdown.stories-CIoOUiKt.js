import{P as f}from"./index-Dc6aGFlU.js";import"./index-BwObudrw.js";import"./constants-TbmyjgfL.js";import"./index-DwbqM05R.js";import"./index-BRIPf3Vz.js";import"./index-Cv3BXN2l.js";import"./index-CuLb3zNn.js";import"./index-p1xEmOam.js";const T={title:"Components/Dropdown",tags:["autodocs"],parameters:{docs:{description:{component:"Dropdown component for selecting options or providing contextual actions. Supports multiple styles, sizes, directions, and split variants. Uses element-level tokens and Bootstrap 4 for menu functionality."}}}},b={render:()=>{const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-section-gap-xl)";const y=["dropdown","dropup","dropleft","dropright"],i=[!1,!0],s=[!1,!0],c=[{text:"Form",leadingIcon:"th",counter:20,dropright:!0},{text:"Form",leadingIcon:"th",counter:20,dropright:!0},{text:"Form",leadingIcon:"th",counter:20,dropright:!0,selected:!0}];return i.forEach(t=>{const m=document.createElement("div");m.style.display="flex",m.style.flexDirection="column",m.style.gap="var(--size-card-gap-lg)";const u=document.createElement("div");u.className="h5",u.textContent=t?"Split Dropdown":"Standard Dropdown",u.style.marginBottom="var(--size-element-gap-md)",m.appendChild(u),y.forEach(o=>{const p=document.createElement("div");p.style.display="flex",p.style.flexDirection="row",p.style.flexWrap="wrap",p.style.gap="var(--size-section-gap-lg)",p.style.alignItems="flex-start",p.style.marginBottom="var(--size-card-gap-md)";const l=document.createElement("div");l.className="body2-txt",l.textContent=`Direction: ${o}`,l.style.width="100%",l.style.marginBottom="var(--size-element-gap-xs)",p.appendChild(l),s.forEach(w=>{const a=document.createElement("div");a.style.display="flex",a.style.flexDirection="column",a.style.gap="var(--size-element-gap-xs)",a.style.alignItems="flex-start",a.style.minWidth="250px",a.style.flexShrink="0",a.style.minWidth="200px",a.style.marginRight="var(--size-section-gap-md)";const g=document.createElement("div");g.className="caption-txt",g.textContent=w?"Open":"Closed",g.style.opacity="0.7",a.appendChild(g);const e=f.createDropdown({buttonText:t?"Split Dropdown":"Dropdown",size:"default",style:"primary",split:t,direction:o,items:w?c:[]});if(w){const r=e.querySelector(".dropdown-menu"),d=e.querySelector(".dropdown-toggle")||e.querySelector(".pdropdown-split-toggle-btn");if(r&&d){r.style.display="block",r.style.opacity="1",r.style.position="static",r.style.transform="none",r.style.margin="0",r.classList.add("show");const h=t?e.querySelector(".pdropdown-split-text-btn"):d;e.setAttribute("data-storybook-open","true"),o==="dropup"?(h&&r.parentElement===e&&e.insertBefore(r,h),e.style.display="flex",e.style.flexDirection="column-reverse",e.style.gap="var(--size-element-gap-sm)",e.style.alignItems="flex-start"):o==="dropleft"?(h&&r.parentElement===e&&e.insertBefore(r,h),e.style.display="flex",e.style.flexDirection="row-reverse",e.style.gap="var(--size-element-gap-sm)",e.style.alignItems="flex-start"):o==="dropright"?(e.style.display="flex",e.style.flexDirection="row",e.style.gap="var(--size-element-gap-sm)",e.style.alignItems="flex-start"):(e.style.display="flex",e.style.flexDirection="column",e.style.gap="var(--size-element-gap-sm)",e.style.alignItems="flex-start")}d&&d.setAttribute("aria-expanded","true")}else setTimeout(()=>{if(typeof $<"u"&&$.fn.dropdown){const r=$(e).find(".dropdown-toggle");r.length&&!r.data("bs.dropdown")&&(r.dropdown(),r.on("shown.bs.dropdown",function(){const d=e.querySelector(".dropdown-menu");d&&d.classList.add("show")}),r.on("hidden.bs.dropdown",function(){const d=e.querySelector(".dropdown-menu");d&&(d.style.display="",d.classList.remove("show"),e.getAttribute("data-storybook-open")&&(e.style.display="",e.style.flexDirection="",e.style.gap="",e.removeAttribute("data-storybook-open")))}))}},0);a.appendChild(e),p.appendChild(a)}),m.appendChild(p)}),n.appendChild(m)}),n}},v={render:()=>{const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="row",n.style.gap="var(--size-card-gap-lg)",n.style.alignItems="flex-start";const y=[{text:"Form",leadingIcon:"th",counter:20,dropright:!0},{text:"Form",leadingIcon:"th",counter:20,dropright:!0},{text:"Form",leadingIcon:"th",counter:20,dropright:!0,selected:!0}],i=document.createElement("div");i.style.display="flex",i.style.flexDirection="column",i.style.gap="var(--size-element-gap-sm)";const s=document.createElement("div");s.className="body2-txt",s.textContent="Closed (open?=false)",i.appendChild(s);const c=f.createDropdown({buttonText:"Dropdown",size:"default",style:"primary",split:!1,direction:"dropdown",items:[]});setTimeout(()=>{if(typeof $<"u"&&$.fn.dropdown){const l=$(c).find(".dropdown-toggle");l.length&&!l.data("bs.dropdown")&&l.dropdown()}},0),i.appendChild(c),n.appendChild(i);const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="column",t.style.gap="var(--size-element-gap-sm)";const m=document.createElement("div");m.className="body2-txt",m.textContent="Open (open?=true)",t.appendChild(m);const u=f.createDropdown({buttonText:"Dropdown",size:"default",style:"primary",split:!1,direction:"dropdown",items:y}),o=u.querySelector(".dropdown-menu");o&&(o.style.display="block",o.style.position="static",o.style.transform="none",o.style.opacity="1",o.style.marginTop="0",o.classList.add("show"));const p=u.querySelector(".dropdown-toggle");return p&&p.setAttribute("aria-expanded","true"),t.appendChild(u),n.appendChild(t),n}},D={render:()=>{const n=document.createElement("div");n.style.display="flex",n.style.flexDirection="column",n.style.gap="var(--size-card-gap-lg)";const y=[{text:"Form",leadingIcon:"th",counter:20,dropright:!0},{text:"Form",leadingIcon:"th",counter:20,dropright:!0},{text:"Form",leadingIcon:"th",counter:20,dropright:!0,selected:!0}],i=document.createElement("div");i.style.display="flex",i.style.flexDirection="column",i.style.gap="var(--size-card-gap-md)";const s=document.createElement("div");s.className="body1-txt",s.textContent="Standard Dropdown (split?=false)",s.style.marginBottom="var(--size-element-gap-sm)",i.appendChild(s);const c=document.createElement("div");c.className="body2-txt",c.textContent="Single button dropdown: users can toggle the dropdown by clicking anywhere on the dropdown button.",c.style.marginBottom="var(--size-element-gap-md)",c.style.opacity="0.8",i.appendChild(c);const t=document.createElement("div");t.style.display="flex",t.style.flexDirection="row",t.style.gap="var(--size-element-gap-md)",t.style.alignItems="flex-start";const m=f.createDropdown({buttonText:"Dropdown",size:"default",style:"primary",split:!1,direction:"dropdown",items:[]});setTimeout(()=>{if(typeof $<"u"&&$.fn.dropdown){const x=$(m).find(".dropdown-toggle");x.length&&!x.data("bs.dropdown")&&x.dropdown()}},0),t.appendChild(m);const u=f.createDropdown({buttonText:"Dropdown",size:"default",style:"primary",split:!1,direction:"dropdown",items:y}),o=u.querySelector(".dropdown-menu");o&&(o.style.display="block",o.style.position="static",o.style.transform="none",o.style.opacity="1",o.style.marginTop="var(--size-element-gap-sm)",o.style.marginBottom="0",o.classList.add("show"));const p=u.querySelector(".dropdown-toggle");p&&p.setAttribute("aria-expanded","true"),t.appendChild(u),i.appendChild(t),n.appendChild(i);const l=document.createElement("div");l.style.display="flex",l.style.flexDirection="column",l.style.gap="var(--size-card-gap-md)";const w=document.createElement("div");w.className="body1-txt",w.textContent="Split Dropdown (split?=true)",w.style.marginBottom="var(--size-element-gap-sm)",l.appendChild(w);const a=document.createElement("div");a.className="body2-txt",a.textContent="Split button dropdown: users can toggle the dropdown only by clicking the arrow icon.",a.style.marginBottom="var(--size-element-gap-md)",a.style.opacity="0.8",l.appendChild(a);const g=document.createElement("div");g.style.display="flex",g.style.flexDirection="row",g.style.gap="var(--size-element-gap-md)",g.style.alignItems="flex-start";const e=f.createDropdown({buttonText:"Split Dropdown",size:"default",style:"primary",split:!0,direction:"dropdown",items:[]});setTimeout(()=>{if(typeof $<"u"&&$.fn.dropdown){const x=$(e).find(".dropdown-toggle");x.length&&!x.data("bs.dropdown")&&x.dropdown()}},0),g.appendChild(e);const r=f.createDropdown({buttonText:"Split Dropdown",size:"default",style:"primary",split:!0,direction:"dropdown",items:y}),d=r.querySelector(".dropdown-menu");d&&(d.style.display="block",d.style.position="static",d.style.transform="none",d.style.opacity="1",d.style.marginTop="var(--size-element-gap-sm)",d.style.marginBottom="0",d.classList.add("show"));const h=r.querySelector(".dropdown-toggle");return h&&h.setAttribute("aria-expanded","true"),g.appendChild(r),l.appendChild(g),n.appendChild(l),n}},C={render:n=>{const y=document.createElement("div"),i=n.items||[{text:"Form",leadingIcon:"th",counter:20,dropright:!0,onClick:()=>console.log("Form clicked")},{text:"Form",leadingIcon:"th",counter:20,dropright:!0,onClick:()=>console.log("Form clicked")},{text:"Form",leadingIcon:"th",counter:20,dropright:!0,selected:!0,onClick:()=>console.log("Form clicked (selected)")}],s=f.createDropdown({...n,items:i});if(y.appendChild(s),typeof $<"u"){const c=$(s).find(".dropdown-toggle");c.dropdown({}),c.on("shown.bs.dropdown",function(){const t=s.querySelector(".dropdown-menu");t&&t.classList.add("show")}),c.on("hidden.bs.dropdown",function(){const t=s.querySelector(".dropdown-menu");t&&(t.style.display="",t.style.position="",t.style.transform="",t.style.margin="",t.style.opacity="",t.classList.remove("show")),s.getAttribute("data-storybook-open")&&(s.style.display="",s.style.flexDirection="",s.style.gap="",s.removeAttribute("data-storybook-open"))})}return y},argTypes:{buttonText:{control:"text",description:"Dropdown button text"},size:{control:"select",options:["small","default","large"],description:"Dropdown size (uses element padding tokens: --size-element-pad-x-sm/md/lg, --size-element-pad-y-sm/md/lg)"},style:{control:"select",options:["default","primary","secondary","success","danger","warning","info"],description:"Dropdown style (uses color tokens: --color-primary, --color-secondary, etc.)"},split:{control:"boolean",description:"Split button dropdown"},direction:{control:"select",options:["dropdown","dropup","dropleft","dropright"],description:"Dropdown direction"},items:{control:"object",description:"Array of dropdown items. Each item can have: text, leadingIcon, counter, dropright, selected, disabled, onClick"}},args:{buttonText:"Dropdown",size:"default",style:"primary",split:!1,direction:"dropdown",items:[{text:"Form",leadingIcon:"th",counter:20,dropright:!0,onClick:()=>console.log("Form clicked")},{text:"Form",leadingIcon:"th",counter:20,dropright:!0,onClick:()=>console.log("Form clicked")},{text:"Form",leadingIcon:"th",counter:20,dropright:!0,selected:!0,onClick:()=>console.log("Form clicked (selected)")}]}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-section-gap-xl)';
    const directions = ['dropdown', 'dropup', 'dropleft', 'dropright'];
    const splitOptions = [false, true];
    const openStates = [false, true];

    // Standard dropdown items for menu (matching Figma - 3 items with icon, counter, dropright)
    const menuItems = [{
      text: 'Form',
      leadingIcon: 'th',
      counter: 20,
      dropright: true
    }, {
      text: 'Form',
      leadingIcon: 'th',
      counter: 20,
      dropright: true
    }, {
      text: 'Form',
      leadingIcon: 'th',
      counter: 20,
      dropright: true,
      selected: true
    }];

    // Create sections for each split option
    splitOptions.forEach(split => {
      const splitSection = document.createElement('div');
      splitSection.style.display = 'flex';
      splitSection.style.flexDirection = 'column';
      splitSection.style.gap = 'var(--size-card-gap-lg)';
      const splitLabel = document.createElement('div');
      splitLabel.className = 'h5';
      splitLabel.textContent = split ? 'Split Dropdown' : 'Standard Dropdown';
      splitLabel.style.marginBottom = 'var(--size-element-gap-md)';
      splitSection.appendChild(splitLabel);

      // Create grid for each direction
      directions.forEach(direction => {
        const directionGroup = document.createElement('div');
        directionGroup.style.display = 'flex';
        directionGroup.style.flexDirection = 'row';
        directionGroup.style.flexWrap = 'wrap';
        directionGroup.style.gap = 'var(--size-section-gap-lg)';
        directionGroup.style.alignItems = 'flex-start';
        directionGroup.style.marginBottom = 'var(--size-card-gap-md)';
        const directionLabel = document.createElement('div');
        directionLabel.className = 'body2-txt';
        directionLabel.textContent = \`Direction: \${direction}\`;
        directionLabel.style.width = '100%';
        directionLabel.style.marginBottom = 'var(--size-element-gap-xs)';
        directionGroup.appendChild(directionLabel);

        // Create closed and open states side by side
        openStates.forEach(open => {
          const stateWrapper = document.createElement('div');
          stateWrapper.style.display = 'flex';
          stateWrapper.style.flexDirection = 'column';
          stateWrapper.style.gap = 'var(--size-element-gap-xs)';
          stateWrapper.style.alignItems = 'flex-start';
          stateWrapper.style.minWidth = '250px'; // Ensure enough space for split dropdowns
          stateWrapper.style.flexShrink = '0'; // Prevent shrinking
          stateWrapper.style.minWidth = '200px'; // Ensure enough space for split dropdowns
          stateWrapper.style.marginRight = 'var(--size-section-gap-md)'; // Add spacing between closed/open columns

          const stateLabel = document.createElement('div');
          stateLabel.className = 'caption-txt';
          stateLabel.textContent = open ? 'Open' : 'Closed';
          stateLabel.style.opacity = '0.7';
          stateWrapper.appendChild(stateLabel);
          const dropdown = PlusInterface.createDropdown({
            buttonText: split ? 'Split Dropdown' : 'Dropdown',
            size: 'default',
            style: 'primary',
            split: split,
            direction: direction,
            items: open ? menuItems : []
          });

          // If open, show the menu with proper positioning based on direction
          if (open) {
            const menu = dropdown.querySelector('.dropdown-menu');
            const toggle = dropdown.querySelector('.dropdown-toggle') || dropdown.querySelector('.pdropdown-split-toggle-btn');
            if (menu && toggle) {
              menu.style.display = 'block';
              menu.style.opacity = '1';
              menu.style.position = 'static'; // Static positioning for Storybook display
              menu.style.transform = 'none';
              menu.style.margin = '0';
              // Add show class for Bootstrap compatibility
              menu.classList.add('show');

              // For split dropdowns, buttons are direct children. For standard, toggle is direct child.
              // Find the first button element to insert menu before/after
              const firstButton = split ? dropdown.querySelector('.pdropdown-split-text-btn') : toggle;

              // Position menu relative to button based on direction using flexbox on dropdown container
              // Use a data attribute to mark this as a Storybook static display, so we can remove styles later
              dropdown.setAttribute('data-storybook-open', 'true');
              if (direction === 'dropup') {
                // Menu should appear ABOVE the button
                // Move menu before first button, then use flexbox column-reverse
                if (firstButton && menu.parentElement === dropdown) {
                  dropdown.insertBefore(menu, firstButton);
                }
                dropdown.style.display = 'flex';
                dropdown.style.flexDirection = 'column-reverse';
                dropdown.style.gap = 'var(--size-element-gap-sm)';
                dropdown.style.alignItems = 'flex-start';
              } else if (direction === 'dropleft') {
                // Menu should appear to the LEFT of the button
                // Move menu before first button, then use flexbox row-reverse
                if (firstButton && menu.parentElement === dropdown) {
                  dropdown.insertBefore(menu, firstButton);
                }
                dropdown.style.display = 'flex';
                dropdown.style.flexDirection = 'row-reverse';
                dropdown.style.gap = 'var(--size-element-gap-sm)';
                dropdown.style.alignItems = 'flex-start';
              } else if (direction === 'dropright') {
                // Menu should appear to the RIGHT of the button
                // Menu is already after buttons, use flexbox row
                dropdown.style.display = 'flex';
                dropdown.style.flexDirection = 'row';
                dropdown.style.gap = 'var(--size-element-gap-sm)';
                dropdown.style.alignItems = 'flex-start';
              } else {
                // dropdown (default) - menu should appear BELOW the button
                // Menu is already after buttons, use flexbox column
                dropdown.style.display = 'flex';
                dropdown.style.flexDirection = 'column';
                dropdown.style.gap = 'var(--size-element-gap-sm)';
                dropdown.style.alignItems = 'flex-start';
              }
            }
            if (toggle) {
              toggle.setAttribute('aria-expanded', 'true');
            }
          } else {
            // For closed state, initialize Bootstrap dropdown so it works when clicked
            // Use setTimeout to ensure DOM is ready
            setTimeout(() => {
              if (typeof $ !== 'undefined' && $.fn.dropdown) {
                const $toggle = $(dropdown).find('.dropdown-toggle');
                if ($toggle.length && !$toggle.data('bs.dropdown')) {
                  $toggle.dropdown();

                  // When Bootstrap shows the menu, add the show class
                  $toggle.on('shown.bs.dropdown', function () {
                    const menu = dropdown.querySelector('.dropdown-menu');
                    if (menu) {
                      menu.classList.add('show');
                    }
                  });

                  // When Bootstrap hides the menu, ensure it can override our inline styles
                  $toggle.on('hidden.bs.dropdown', function () {
                    const menu = dropdown.querySelector('.dropdown-menu');
                    if (menu) {
                      // Remove inline display style so Bootstrap can hide it
                      menu.style.display = '';
                      menu.classList.remove('show');
                      // Also reset container flex styles if they were set
                      if (dropdown.getAttribute('data-storybook-open')) {
                        dropdown.style.display = '';
                        dropdown.style.flexDirection = '';
                        dropdown.style.gap = '';
                        dropdown.removeAttribute('data-storybook-open');
                      }
                    }
                  });
                }
              }
            }, 0);
          }
          stateWrapper.appendChild(dropdown);
          directionGroup.appendChild(stateWrapper);
        });
        splitSection.appendChild(directionGroup);
      });
      container.appendChild(splitSection);
    });
    return container;
  }
}`,...b.parameters?.docs?.source},description:{story:`All Variants
Shows all dropdown combinations: open/closed states × split/non-split × directions
Organized exactly as shown in Figma design system`,...b.parameters?.docs?.description}}};v.parameters={...v.parameters,docs:{...v.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.gap = 'var(--size-card-gap-lg)';
    container.style.alignItems = 'flex-start';
    const menuItems = [{
      text: 'Form',
      leadingIcon: 'th',
      counter: 20,
      dropright: true
    }, {
      text: 'Form',
      leadingIcon: 'th',
      counter: 20,
      dropright: true
    }, {
      text: 'Form',
      leadingIcon: 'th',
      counter: 20,
      dropright: true,
      selected: true
    }];

    // Closed state
    const closedWrapper = document.createElement('div');
    closedWrapper.style.display = 'flex';
    closedWrapper.style.flexDirection = 'column';
    closedWrapper.style.gap = 'var(--size-element-gap-sm)';
    const closedLabel = document.createElement('div');
    closedLabel.className = 'body2-txt';
    closedLabel.textContent = 'Closed (open?=false)';
    closedWrapper.appendChild(closedLabel);
    const closedDropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: []
    });

    // Initialize Bootstrap dropdown for closed state
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.dropdown) {
        const $toggle = $(closedDropdown).find('.dropdown-toggle');
        if ($toggle.length && !$toggle.data('bs.dropdown')) {
          $toggle.dropdown();
        }
      }
    }, 0);
    closedWrapper.appendChild(closedDropdown);
    container.appendChild(closedWrapper);

    // Open state
    const openWrapper = document.createElement('div');
    openWrapper.style.display = 'flex';
    openWrapper.style.flexDirection = 'column';
    openWrapper.style.gap = 'var(--size-element-gap-sm)';
    const openLabel = document.createElement('div');
    openLabel.className = 'body2-txt';
    openLabel.textContent = 'Open (open?=true)';
    openWrapper.appendChild(openLabel);
    const openDropdown = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: menuItems
    });

    // Show the menu in open state
    const menu = openDropdown.querySelector('.dropdown-menu');
    if (menu) {
      menu.style.display = 'block';
      menu.style.position = 'static';
      menu.style.transform = 'none';
      menu.style.opacity = '1';
      menu.style.marginTop = '0';
      menu.classList.add('show');
    }
    const toggle = openDropdown.querySelector('.dropdown-toggle');
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
    }
    openWrapper.appendChild(openDropdown);
    container.appendChild(openWrapper);
    return container;
  }
}`,...v.parameters?.docs?.source},description:{story:`Open Property
Toggle the open? switch to open the dropdown list.
Do NOT edit the spacing between the dropdown button and dropdown list.`,...v.parameters?.docs?.description}}};D.parameters={...D.parameters,docs:{...D.parameters?.docs,source:{originalSource:`{
  render: () => {
    const container = document.createElement('div');
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = 'var(--size-card-gap-lg)';
    const menuItems = [{
      text: 'Form',
      leadingIcon: 'th',
      counter: 20,
      dropright: true
    }, {
      text: 'Form',
      leadingIcon: 'th',
      counter: 20,
      dropright: true
    }, {
      text: 'Form',
      leadingIcon: 'th',
      counter: 20,
      dropright: true,
      selected: true
    }];

    // Standard dropdown (split?=false)
    const standardGroup = document.createElement('div');
    standardGroup.style.display = 'flex';
    standardGroup.style.flexDirection = 'column';
    standardGroup.style.gap = 'var(--size-card-gap-md)';
    const standardLabel = document.createElement('div');
    standardLabel.className = 'body1-txt';
    standardLabel.textContent = 'Standard Dropdown (split?=false)';
    standardLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    standardGroup.appendChild(standardLabel);
    const standardDescription = document.createElement('div');
    standardDescription.className = 'body2-txt';
    standardDescription.textContent = 'Single button dropdown: users can toggle the dropdown by clicking anywhere on the dropdown button.';
    standardDescription.style.marginBottom = 'var(--size-element-gap-md)';
    standardDescription.style.opacity = '0.8';
    standardGroup.appendChild(standardDescription);
    const standardRow = document.createElement('div');
    standardRow.style.display = 'flex';
    standardRow.style.flexDirection = 'row';
    standardRow.style.gap = 'var(--size-element-gap-md)';
    standardRow.style.alignItems = 'flex-start';

    // Closed standard
    const standardClosed = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: []
    });

    // Initialize Bootstrap dropdown for closed state
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.dropdown) {
        const $toggle = $(standardClosed).find('.dropdown-toggle');
        if ($toggle.length && !$toggle.data('bs.dropdown')) {
          $toggle.dropdown();
        }
      }
    }, 0);
    standardRow.appendChild(standardClosed);

    // Open standard (dropdown direction - opens downward)
    const standardOpen = PlusInterface.createDropdown({
      buttonText: 'Dropdown',
      size: 'default',
      style: 'primary',
      split: false,
      direction: 'dropdown',
      items: menuItems
    });
    const menu1 = standardOpen.querySelector('.dropdown-menu');
    if (menu1) {
      menu1.style.display = 'block';
      menu1.style.position = 'static';
      menu1.style.transform = 'none';
      menu1.style.opacity = '1';
      menu1.style.marginTop = 'var(--size-element-gap-sm)';
      menu1.style.marginBottom = '0';
      menu1.classList.add('show');
    }
    const toggle1 = standardOpen.querySelector('.dropdown-toggle');
    if (toggle1) {
      toggle1.setAttribute('aria-expanded', 'true');
    }
    standardRow.appendChild(standardOpen);
    standardGroup.appendChild(standardRow);
    container.appendChild(standardGroup);

    // Split dropdown (split?=true)
    const splitGroup = document.createElement('div');
    splitGroup.style.display = 'flex';
    splitGroup.style.flexDirection = 'column';
    splitGroup.style.gap = 'var(--size-card-gap-md)';
    const splitLabel = document.createElement('div');
    splitLabel.className = 'body1-txt';
    splitLabel.textContent = 'Split Dropdown (split?=true)';
    splitLabel.style.marginBottom = 'var(--size-element-gap-sm)';
    splitGroup.appendChild(splitLabel);
    const splitDescription = document.createElement('div');
    splitDescription.className = 'body2-txt';
    splitDescription.textContent = 'Split button dropdown: users can toggle the dropdown only by clicking the arrow icon.';
    splitDescription.style.marginBottom = 'var(--size-element-gap-md)';
    splitDescription.style.opacity = '0.8';
    splitGroup.appendChild(splitDescription);
    const splitRow = document.createElement('div');
    splitRow.style.display = 'flex';
    splitRow.style.flexDirection = 'row';
    splitRow.style.gap = 'var(--size-element-gap-md)';
    splitRow.style.alignItems = 'flex-start';

    // Closed split
    const splitClosed = PlusInterface.createDropdown({
      buttonText: 'Split Dropdown',
      size: 'default',
      style: 'primary',
      split: true,
      direction: 'dropdown',
      items: []
    });

    // Initialize Bootstrap dropdown for closed state
    setTimeout(() => {
      if (typeof $ !== 'undefined' && $.fn.dropdown) {
        const $toggle = $(splitClosed).find('.dropdown-toggle');
        if ($toggle.length && !$toggle.data('bs.dropdown')) {
          $toggle.dropdown();
        }
      }
    }, 0);
    splitRow.appendChild(splitClosed);

    // Open split (dropdown direction - opens downward)
    const splitOpen = PlusInterface.createDropdown({
      buttonText: 'Split Dropdown',
      size: 'default',
      style: 'primary',
      split: true,
      direction: 'dropdown',
      items: menuItems
    });
    const menu2 = splitOpen.querySelector('.dropdown-menu');
    if (menu2) {
      menu2.style.display = 'block';
      menu2.style.position = 'static';
      menu2.style.transform = 'none';
      menu2.style.opacity = '1';
      menu2.style.marginTop = 'var(--size-element-gap-sm)';
      menu2.style.marginBottom = '0';
      menu2.classList.add('show');
    }
    const toggle2 = splitOpen.querySelector('.dropdown-toggle');
    if (toggle2) {
      toggle2.setAttribute('aria-expanded', 'true');
    }
    splitRow.appendChild(splitOpen);
    splitGroup.appendChild(splitRow);
    container.appendChild(splitGroup);
    return container;
  }
}`,...D.parameters?.docs?.source},description:{story:`Split Property
Toggle the split? switch to change between a normal dropdown and a split dropdown.
Single button dropdown: users can toggle the dropdown by clicking anywhere on the dropdown button.
Split button dropdown: users can toggle the dropdown only by clicking the arrow icon.`,...D.parameters?.docs?.description}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  render: args => {
    const container = document.createElement('div');

    // Default items with all properties (matching Figma design)
    const defaultItems = args.items || [{
      text: 'Form',
      leadingIcon: 'th',
      counter: 20,
      dropright: true,
      onClick: () => console.log('Form clicked')
    }, {
      text: 'Form',
      leadingIcon: 'th',
      counter: 20,
      dropright: true,
      onClick: () => console.log('Form clicked')
    }, {
      text: 'Form',
      leadingIcon: 'th',
      counter: 20,
      dropright: true,
      selected: true,
      onClick: () => console.log('Form clicked (selected)')
    }];
    const dropdown = PlusInterface.createDropdown({
      ...args,
      items: defaultItems
    });
    container.appendChild(dropdown);

    // Initialize Bootstrap dropdown with proper direction handling
    if (typeof $ !== 'undefined') {
      const $toggle = $(dropdown).find('.dropdown-toggle');
      // Bootstrap 4 should automatically handle direction based on parent classes
      // (dropup, dropleft, dropright) which are already set on the dropdown container
      // The direction classes on the parent .pdropdown container tell Bootstrap where to position
      $toggle.dropdown({
        // Bootstrap will use Popper.js to position based on parent direction classes
        // No need to set offset or placement - Bootstrap handles this automatically
      });

      // When Bootstrap shows the menu, add the show class
      $toggle.on('shown.bs.dropdown', function () {
        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu) {
          menu.classList.add('show');
        }
      });

      // Ensure Bootstrap can hide the menu by removing inline styles when hidden
      $toggle.on('hidden.bs.dropdown', function () {
        const menu = dropdown.querySelector('.dropdown-menu');
        if (menu) {
          // Remove inline display style so Bootstrap can hide it
          menu.style.display = '';
          menu.style.position = '';
          menu.style.transform = '';
          menu.style.margin = '';
          menu.style.opacity = '';
          menu.classList.remove('show');
        }
        // Also reset container flex styles if they were set
        if (dropdown.getAttribute('data-storybook-open')) {
          dropdown.style.display = '';
          dropdown.style.flexDirection = '';
          dropdown.style.gap = '';
          dropdown.removeAttribute('data-storybook-open');
        }
      });
    }
    return container;
  },
  argTypes: {
    buttonText: {
      control: 'text',
      description: 'Dropdown button text'
    },
    size: {
      control: 'select',
      options: ['small', 'default', 'large'],
      description: 'Dropdown size (uses element padding tokens: --size-element-pad-x-sm/md/lg, --size-element-pad-y-sm/md/lg)'
    },
    style: {
      control: 'select',
      options: ['default', 'primary', 'secondary', 'success', 'danger', 'warning', 'info'],
      description: 'Dropdown style (uses color tokens: --color-primary, --color-secondary, etc.)'
    },
    split: {
      control: 'boolean',
      description: 'Split button dropdown'
    },
    direction: {
      control: 'select',
      options: ['dropdown', 'dropup', 'dropleft', 'dropright'],
      description: 'Dropdown direction'
    },
    items: {
      control: 'object',
      description: 'Array of dropdown items. Each item can have: text, leadingIcon, counter, dropright, selected, disabled, onClick'
    }
  },
  args: {
    buttonText: 'Dropdown',
    size: 'default',
    style: 'primary',
    split: false,
    direction: 'dropdown',
    items: [{
      text: 'Form',
      leadingIcon: 'th',
      counter: 20,
      dropright: true,
      onClick: () => console.log('Form clicked')
    }, {
      text: 'Form',
      leadingIcon: 'th',
      counter: 20,
      dropright: true,
      onClick: () => console.log('Form clicked')
    }, {
      text: 'Form',
      leadingIcon: 'th',
      counter: 20,
      dropright: true,
      selected: true,
      onClick: () => console.log('Form clicked (selected)')
    }]
  }
}`,...C.parameters?.docs?.source},description:{story:`Interactive Dropdown
Interactive playground for testing dropdown variations`,...C.parameters?.docs?.description}}};const W=["AllVariants","OpenProperty","SplitProperty","Interactive"];export{b as AllVariants,C as Interactive,v as OpenProperty,D as SplitProperty,W as __namedExportsOrder,T as default};
