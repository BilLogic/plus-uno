/**
 * Canonical PLUS JSX snippets used by Storybook Overview `parameters.docs.source`.
 * These examples mirror how components/forms are implemented and consumed in this repo.
 */

const snippet = (lines) => lines.join('\n');

export const webAppSourceSnippets = {
    accordion: snippet([
        '<Accordion',
        '  items={[',
        '    { eventKey: "0", header: "Accordion Item #1", body: "This is the first accordion item\'s content." },',
        '    { eventKey: "1", header: "Accordion Item #2", body: "This is the second accordion item\'s content." },',
        '    { eventKey: "2", header: "Accordion Item #3", body: "This is the third accordion item\'s content." },',
        '  ]}',
        '  defaultActiveKey="0"',
        '/>'
    ]),
    sectionMessage: snippet([
        '<SectionMessage',
        '  appearance="primary"',
        '  title="With Title"',
        '  dismissible',
        '>',
        '  Message with title and body text.',
        '</SectionMessage>'
    ]),
    badge: snippet([
        '<StatusTag appearance="info">Primary</StatusTag>'
    ]),
    breadcrumb: snippet([
        '<Breadcrumb',
        '  items={[',
        '    { text: "Home", href: "/" },',
        '    { text: "Training", href: "/training" },',
        '    { text: "Lessons", href: "/lessons" },',
        '    { text: "Current Page" },',
        '  ]}',
        '/>'
    ]),
    button: snippet([
        '<Button',
        '  text="Button"',
        '  appearance="primary"',
        '/>'
    ]),
    splitButton: snippet([
        '<SplitButton>',
        '  <Button text="Save" appearance="primary" />',
        '  <IconButton icon="chevron-down" label="More save options" aria-haspopup="menu" />',
        '</SplitButton>'
    ]),
    filterButton: snippet([
        '<FilterButton',
        '  text="Status"',
        '  trailingMetric={2}',
        '/>'
    ]),
    verticalButton: snippet([
        '<VerticalButton',
        '  icon="user-gear"',
        '  label="Admin"',
        '/>'
    ]),
    iconButton: snippet([
        '<IconButton',
        '  icon="pen"',
        '  label="Edit page"',
        '/>'
    ]),
    linkButton: snippet([
        '<LinkButton',
        '  href="/sessions"',
        '  text="View sessions"',
        '/>'
    ]),
    linkIconButton: snippet([
        '<LinkIconButton',
        '  href="/help"',
        '  icon="circle-question"',
        '  label="Open Help Center"',
        '/>'
    ]),
    buttonGroup: snippet([
        '<ButtonGroup label="Alignment">',
        '  <Button text="Left" />',
        '  <Button text="Center" />',
        '  <Button text="Right" />',
        '</ButtonGroup>'
    ]),
    card: snippet([
        '<Card',
        '  title="Card Title"',
        '  body="Some quick example text to build on the card title and make up the bulk of the card\'s content."',
        '/>'
    ]),
    carousel: snippet([
        '<Carousel',
        '  aria-label="What\'s new for tutors"',
        '  slides={[',
        '    { title: \'Prep a session in two minutes\', description: \'See goals and notes before you join.\', media: <SessionPrepArt /> },',
        '    { title: \'Reflect while it is fresh\', description: \'Record what worked and what to try next.\', media: <ReflectionArt /> },',
        '    { title: \'Training between sessions\', description: \'Lessons run ten minutes or less.\', media: <TrainingArt /> },',
        '  ]}',
        '/>'
    ]),
    collapse: snippet([
        '<Collapse',
        '  id="overview-collapse"',
        '  trigger="Toggle Content"',
        '  triggerClass="btn btn-primary"',
        '  defaultOpen={false}',
        '>',
        '  <Card',
        '    body="Some placeholder content for the collapse component."',
        '    className="mt-2"',
        '    showBorder',
        '  />',
        '</Collapse>'
    ]),
    jumbotron: snippet([
        '<Jumbotron',
        '  title="Plan your next session"',
        '  description="See who is on your roster, review their progress and join the call from one place."',
        '  actions={<>',
        '    <Button text="Get started" appearance="primary" />',
        '    <Button text="Learn more" />',
        '  </>}',
        '/>'
    ]),
    mediaObject: snippet([
        '<MediaObject',
        '  media={<div style={{ width: 64, height: 64 }} />}',
        '  heading="Media heading"',
        '>',
        '  Will you do the same for me? It\'s time to face the music.',
        '</MediaObject>'
    ]),
    modal: snippet([
        '<Modal',
        '  show',
        '  renderAs="inline"',
        '  title="Modal title"',
        '  body="Modal body text goes here."',
        '  width="6-col"',
        '  height="hug"',
        '  showBottomButtons',
        '  primaryButton={{ text: "Primary", appearance: "primary" }}',
        '  secondaryButton={{ text: "Secondary" }}',
        '  onClose={() => {}}',
        '/>'
    ]),
    tabs: snippet([
        '<Tabs defaultActiveKey="1">',
        '  <Tabs.Tab eventKey="1">Home</Tabs.Tab>',
        '  <Tabs.Tab eventKey="2">Profile</Tabs.Tab>',
        '  <Tabs.Tab eventKey="3">Messages</Tabs.Tab>',
        '</Tabs>'
    ]),
    pagination: snippet([
        '<Pagination',
        '  currentPage={5}',
        '  totalPages={10}',
        '  navigator="icon"',
        '  spacing="default"',
        '  max={5}',
        '  onPageChange={(page) => setPage(page)}',
        '/>'
    ]),
    popup: snippet([
        '<div className="plus-popup-overview-static">',
        '  <Button type="button" text="Toggle popup" appearance="primary" />',
        '  <div className="plus-popup">',
        '    <div className="plus-popup-title">Popup title</div>',
        '    <div className="plus-popup-body">',
        '      Body content appears below the title.',
        '    </div>',
        '  </div>',
        '</div>'
    ]),
    progressBar: snippet([
        '<ProgressBar value={50} />'
    ]),
    richTextEditor: snippet([
        '<RichTextEditor',
        '  placeholder="Type something..."',
        '  minHeight={150}',
        '/>'
    ]),
    spinner: snippet([
        '<Spinner />'
    ]),
    flag: snippet([
        '<FlagGroup className="p-3" containerPosition="static">',
        '  <Flag title="Normal flag" timestamp="Just now">',
        '    This is a normal flag (default).',
        '  </Flag>',
        '</FlagGroup>'
    ]),
    tooltip: snippet([
        '<Tooltip',
        '  text="Tooltip text"',
        '  placement="top"',
        '  show',
        '>',
        '  <Button appearance="primary" text="Hover me" />',
        '</Tooltip>'
    ]),
    formTextField: snippet([
        '<TextField',
        '  id="text-field-overview"',
        '  label="Label"',
        '  placeholder="Placeholder"',
        '  value=""',
        '  isRequired',
        '  elemAfterInput={<i className="fa-solid fa-icons" aria-hidden="true" />}',
        '/>'
    ]),
    formTextArea: snippet([
        '<TextArea',
        '  id="text-area-overview"',
        '  label="Label"',
        '  placeholder="Enter text..."',
        '  rows={3}',
        '/>'
    ]),
    formSelect: snippet([
        '<Select',
        '  options={sampleOptions}',
        '  placeholder="Select (a/an) {value} from below"',
        '/>'
    ]),
    formCheckbox: snippet([
        '<Checkbox',
        '  id="cb-overview"',
        '  name="cb-overview"',
        '  label="Option"',
        '  defaultChecked',
        '/>'
    ]),
    formRadio: snippet([
        '<>',
        '  <Radio id="radio-overview-1" name="radio-overview" label="Option 1" value="option1" isChecked/>',
        '  <Radio id="radio-overview-2" name="radio-overview" label="Option 2" value="option2"/>',
        '</>'
    ]),
    formToggle: snippet([
        '<Toggle',
        '  id="toggle-overview"',
        '  name="toggle-overview"',
        '  label="Wi-Fi"',
        '  defaultChecked',
        '/>'
    ]),
    formFile: snippet([
        '<FileUpload',
        '  id="file-upload-overview"',
        '  label="Upload files"',
        '  acceptedFormats={formats}',
        '  buttonText="Choose a file"',
        '/>'
    ]),
    formNumberField: snippet([
        '<TextField',
        '  id="number-field-overview"',
        '  type="number"',
        '  label="Number of sessions"',
        '  placeholder="Number"',
        '/>'
    ]),
    formRange: snippet([
        'const [value, setValue] = useState(50);',
        '',
        '<Range',
        '  id="range-overview"',
        '  min={0}',
        '  max={100}',
        '  value={value}',
        '  onChange={(next) => setValue(next)}',
        '/>'
    ]),
    formRating: snippet([
        'const [value, setValue] = useState(3);',
        '',
        '<Rating',
        '  id="rating-overview"',
        '  label="Rating"',
        '  isRequired',
        '  value={value}',
        '  variant="comments"',
        '  onChange={setValue}',
        '/>'
    ]),
    formCascader: snippet([
        'const [value, setValue] = useState([]);',
        '',
        '<Cascader',
        '  id="cascader-overview"',
        '  value={value}',
        '  options={sampleOptions}',
        '  onChange={setValue}',
        '  placeholder="Please select"',
        '/>'
    ]),
    formChoiceGrid: snippet([
        'const [radioValues, setRadioValues] = useState({ "row-1": "col-2" });',
        '',
        '<ChoiceGrid',
        '  id="choice-grid-overview"',
        '  name="choice-grid-overview"',
        '  type="radio"',
        '  rows={[{ id: "row-1", label: "Row 1" }]}',
        '  columns={[',
        '    { id: "col-1", label: "Column 1" },',
        '    { id: "col-2", label: "Column 2" },',
        '    { id: "col-3", label: "Column 3" },',
        '  ]}',
        '  values={radioValues}',
        '  onChange={(rowId, columnId) => setRadioValues({ ...radioValues, [rowId]: columnId })}',
        '/>'
    ]),
    formRadioGroup: snippet([
        'const [value, setValue] = useState(null);',
        '',
        '<RadioGroup',
        '  id="rg-overview"',
        '  name="rg-overview"',
        '  legend="Which subject did you tutor?"',
        '  options={[',
        '    { value: "math", label: "Math" },',
        '    { value: "reading", label: "Reading" },',
        '    { value: "science", label: "Science" },',
        '  ]}',
        '  value={value}',
        '  onChange={setValue}',
        '/>'
    ]),
    formLabelCaption: snippet([
        '<div style={{ display: "flex", flexDirection: "column", gap: "var(--stack-sm)" }}>',
        '  <Label text="Field label" required />',
        '  <Caption text="Helper or validation copy beneath the label." state="default" />',
        '</div>'
    ]),
    formDatePicker: snippet([
        '<DatePicker',
        '  placeholder="Select a date"',
        '/>'
    ]),
    formDateTime: snippet([
        '<DateTimePicker',
        '  id="datetime-overview"',
        '  label="Month"',
        '  isRequired',
        '  showSectionLabels={false}',
        '/>'
    ]),
    formTextFieldAffix: snippet([
        'const [value, setValue] = useState("");',
        '',
        '<TextField',
        '  id="text-field-affix-overview"',
        '  label="Website"',
        '  placeholder="Placeholder"',
        '  elemBeforeInput="https://"',
        '  elemAfterInput={<i className="fa-solid fa-link" aria-hidden="true" />}',
        '  value={value}',
        '  onChange={(e) => setValue(e.target.value)}',
        '/>'
    ])
};
