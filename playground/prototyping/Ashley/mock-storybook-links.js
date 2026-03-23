
export const linkTo = (storyId, storyName) => () => {
    console.log(`[Mock] Link to story: ${storyId} - ${storyName}`);
    alert(`Preview: Navigation to ${storyId} is not available in standalone mode.`);
};
