const styleTag = document.createElement('style')
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
`
document.head.appendChild(styleTag)

const toggleButton = document.createElement('button')
toggleButton.id = 'modelToggleButton'
toggleButton.textContent = 'Loading...' // Initial loading state

const sidebarContainer = document.querySelector(
  '.sticky.top-0.flex.h-full.min-h-0.flex-1.flex-col.pt-md'
)
if (sidebarContainer) {
  console.log('Sidebar container found:', sidebarContainer)
  const middleIndex = Math.floor(sidebarContainer.children.length / 2)
  sidebarContainer.insertBefore(
    toggleButton,
    sidebarContainer.children[middleIndex]
  )
} else {
  console.error('Sidebar container not found!')
}

let currentModel = ''

async function checkCurrentModel () {
  try {
    const response = await fetch('/rest/user/settings?version=2.15', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data?.default_model || 'gpt4o'
  } catch (error) {
    console.error('Error fetching model state:', error)
    return 'gpt4o'
  }
}

function updateButtonText (model) {
  const targetModel = model === 'o1' ? 'gpt4o' : 'o1'
  toggleButton.textContent = `Switch to ${targetModel}`
}

async function initializeButton () {
  currentModel = await checkCurrentModel()
  console.log('Current model:', currentModel)
  updateButtonText(currentModel)

  toggleButton.addEventListener('click', async () => {
    const newModel = currentModel === 'o1' ? 'gpt4o' : 'o1'

    try {
      const response = await fetch(
        '/rest/user/save-settings?version=2.15&source=default',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            updated_settings: {
              model: newModel,
              version: '2.15',
              source: 'default'
            }
          })
        }
      )

      if (!response.ok) {
        throw new Error('Failed to switch model')
      }

      currentModel = newModel
      updateButtonText(currentModel)
    } catch (error) {
      console.error('Error:', error.message)
    }
  })
}

initializeButton()

let pollingInterval = null;

function startPolling() {
    checkCurrentModel().then(model => {
        currentModel = model;
        updateButtonText(model);
    });

    pollingInterval = setInterval(async () => {
        const latestModel = await checkCurrentModel();
        if (latestModel !== currentModel) {
            currentModel = latestModel;
            updateButtonText(latestModel);
        }
    }, 5000);
}

function stopPolling() {
    if (pollingInterval) {
        clearInterval(pollingInterval);
        pollingInterval = null;
    }
}

toggleButton.addEventListener('mouseenter', () => {
    if (!pollingInterval) {
        startPolling();
    }
});

toggleButton.addEventListener('mouseleave', () => {
    stopPolling();
});