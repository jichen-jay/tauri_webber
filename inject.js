const styleTag = document.createElement('style');
styleTag.textContent = `
  #modelToggleButton {
    padding: 10px;
    margin: 20px auto;
    background-color: #007BFF;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    width: 80%;
    display: block;
  }
  #modelToggleButton:hover {
    background-color: #0056b3; /* Darker blue on hover */
  }
`;
document.head.appendChild(styleTag);

const toggleButton = document.createElement('button');
toggleButton.id = 'modelToggleButton';
toggleButton.textContent = 'Switch to o1'; // Initial label

const sidebarContainer = document.querySelector('.sticky.top-0.flex.h-full.min-h-0.flex-1.flex-col.pt-md');
if (sidebarContainer) {
  console.log('Sidebar container found:', sidebarContainer);

  const middleIndex = Math.floor(sidebarContainer.children.length / 2);
  sidebarContainer.insertBefore(toggleButton, sidebarContainer.children[middleIndex]);
} else {
  console.error('Sidebar container not found!');
}

let currentModel = 'GPT-4o';

toggleButton.addEventListener('click', () => {
  const newModel = currentModel === 'GPT-4o' ? 'o1' : 'GPT-4o';

  fetch('/rest/user/save-settings?version=2.15&source=default', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      updated_settings: {
        model: newModel,
        version: '2.15',
        source: 'default'
      }
    }),
  })
    .then(response => {
      if (!response.ok) {
        return response.json().then(err => {
          throw new Error(`Failed to switch model: ${err.message || 'Unknown error'}`);
        });
      }
      console.log(`Model switched to ${newModel} successfully.`);
      currentModel = newModel;
      toggleButton.textContent = `Switch to ${currentModel === 'GPT-4o' ? 'o1' : 'GPT-4o'}`;
    })
    .catch(error => {
      console.error('Error:', error.message);
    });
});
