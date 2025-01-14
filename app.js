document.addEventListener('DOMContentLoaded', () => {

    const sampleFilePath = 'mypath.pargendsl'; // Path to the sample file

    fetch(sampleFilePath)
    .then(response => response.text())
    .then(dslText => {
        const parsedDSL = parseDSL(dslText);
        parsedDSL.forEach(action => addActionToSchema(action.action, schemaPath, action.nestedActions, action.condition));
    })
    .catch(err => console.error('Error loading DSL file:', err));

    /*
        Elements
    */
    const actionList = document.getElementById('actionList');
    const schemaPath = document.getElementById('schemaPath');
    const clearSchemaBtn = document.getElementById('clearSchema');
    const generateCodeBtn = document.getElementById('generateCode');
    const loaderContainer = document.getElementById('loader-container');
    const conditionPopup = document.getElementById('condition-popup');
    const confirmConditionBtn = document.getElementById('confirm-condition');
    const cancelConditionBtn = document.getElementById('cancel-condition');
    const counterBtn = document.getElementById('counter-condition');
    const counterInput = document.getElementById('counter-input');
    const roundsInput = document.getElementById('rounds');
    const fullscreenOverlay = document.getElementById('fullscreen-overlay');
    const emptyPopup = document.getElementById('empty-popup');
    const closeEmptyPopupBtn = document.getElementById('close-popup');
    let currentStructure = null;
    const timePopup = document.getElementById('time-popup');
    const timeInput = document.getElementById('time-input');
    const cancelTimeBtn = document.getElementById('cancel-time');
    const confirmTimeBtn = document.getElementById('confirm-time');
    let pendingAction = null;

    setupEmptyPath();

    /*
        Listeners
    */
    // Drag and Drop for actions
    actionList.addEventListener('dragstart', (e) => {
        if (e.target && e.target.dataset.action) {
            e.dataTransfer.setData('action', e.target.dataset.action);
            e.target.style.opacity = '0.5';
        }
    });

    actionList.addEventListener('dragend', (e) => {
        e.target.style.opacity = '1';
    });

    schemaPath.addEventListener('dragover', (e) => {
        e.preventDefault();
    });

    schemaPath.addEventListener('drop', (e) => {
        e.preventDefault();
        const action = e.dataTransfer.getData('action');
        if (action) {
            handleAction(action, schemaPath);
        }
    });

    actionList.querySelectorAll('li').forEach((actionItem) => {
        actionItem.addEventListener('click', () => {
            const action = actionItem.dataset.action;
            if (action) {
                handleAction(action, schemaPath);
            }
        });
    });

    // Handle time popup
    function handleAction(action, container) {
        if (action === 'avancer' || action === 'reculer') {
            pendingAction = { action, container };
            openTimePopup();
        } else {
            addActionToSchema(action, container);
        }
    }

    function openTimePopup(actionElement) {
        currentActionElement = actionElement;
        timePopup.classList.remove('hidden');
        document.body.style.pointerEvents = 'none'; // Disable background interaction
        timePopup.style.pointerEvents = 'auto';
    }

    // Close the time popup
    function closeTimePopup() {
        timePopup.classList.add('hidden');
        currentActionElement = null;
        document.body.style.pointerEvents = ''; // Re-enable background interaction
    }

    confirmTimeBtn.addEventListener('click', () => {
        const duration = parseInt(timeInput.value, 10); 
        if (pendingAction && !isNaN(duration)) {
            addActionToSchema(pendingAction.action, pendingAction.container, null, null, duration);
        }
        pendingAction = null; 
        closeTimePopup(); 
    });
    

     // Cancel the popup
     cancelTimeBtn.addEventListener('click', closeTimePopup);

    confirmConditionBtn.addEventListener('click', () => {
        const selectedCondition = document.querySelector('.condition-buttons button.selected');
        if (selectedCondition) {
            let conditionText = '';
            if (selectedCondition.id === 'counter-condition') {
                const rounds = roundsInput.value || 2;
                conditionText = `${rounds} tours`;
            } else {
                conditionText = selectedCondition.id === 'no-noise' ? 'Pas de bruit' : 'Pas d\'obstacle';
            }
            currentStructure.querySelector('span').textContent = `${currentStructure.classList.contains('while') ? 'While' : 'If'} (${conditionText})`;
            currentStructure.classList.remove('temp-structure');
            closeConditionPopup();
        }
    });

    cancelConditionBtn.addEventListener('click', () => {
        if (currentStructure && currentStructure.classList.contains('temp-structure')) {
            currentStructure.remove(); // Remove the structure from the path
        }
        closeConditionPopup();
    });

    clearSchemaBtn.addEventListener('click', () => {
        schemaPath.textContent = '';
        const startPoint = document.createElement('div');
        startPoint.classList.add('start');
        schemaPath.appendChild(startPoint);
        updateEndFlag();
    });

    generateCodeBtn.addEventListener('click', () => {
        const fullscreenOverlay = document.getElementById('fullscreen-overlay');
        const loaderContainer = document.getElementById('loader-container');
    
        if (schemaPath.children.length > 2) {
            fullscreenOverlay.classList.remove('hidden'); // Blur background
            loaderContainer.classList.remove('hidden'); // Show loader
    
            setTimeout(() => {
                loaderContainer.classList.add('hidden'); // Hide loader
                fullscreenOverlay.classList.add('hidden'); // Remove blur
    
                const swoosh = document.getElementById('swoosh');
                swoosh.classList.remove('hidden');
                swoosh.classList.add('animate');
                setTimeout(() => {
                    swoosh.classList.remove('animate');
                    swoosh.classList.add('hidden');
                }, 1000);
            }, 3000); // Simulated processing time
        } else {
            openEmptyPopup();
        }
    });

    closeEmptyPopupBtn.addEventListener('click', closeEmptyPopup);

    document.querySelectorAll('.condition-buttons button').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.condition-buttons button').forEach((b) => b.classList.remove('selected'));
            btn.classList.add('selected');
            confirmConditionBtn.disabled = false;

            if (btn.id === 'counter-condition' && currentStructure && currentStructure.classList.contains('while')) {
                counterInput.classList.remove('hidden');
            } else {
                counterInput.classList.add('hidden');
            }
        });
    });
    
    /*
    Functions
    */
    function addActionToSchema(action, container, nestedActions = null, condition = null, duration = null) {
        let structure;
        const icon = document.createElement('i');

        switch (action) {
            case 'avancer':
            case 'reculer':
                const actionWrapper = document.createElement('div');
                actionWrapper.classList.add('action-wrapper');
                icon.classList.add('fas', getIconClass(action));
                const timeText = document.createElement('div');
                timeText.classList.add('time-text');
                timeText.textContent = `(${duration}s)`;
                actionWrapper.appendChild(icon);
                actionWrapper.appendChild(timeText);
                container.appendChild(actionWrapper);
                break;
            case 'tourner-gauche':
            case 'tourner-droite':
            case 'lumiere':
            case 'bruit':
                icon.classList.add('fas', getIconClass(action));
                container.appendChild(icon);
                break;
    
        case 'if':
        case 'while':
            structure = document.createElement('div');
            structure.classList.add('structure', action);
            // Map conditions 
            let conditionText = '';
            if (condition) {
                if (condition === 'noNoise') {
                    conditionText = 'Pas de bruit';
                } else if (condition === 'noObstacle') {
                    conditionText = 'Pas d\'obstacle';
                } else if (condition.startsWith('counter')) {
                    const rounds = condition.match(/\d+/)[0]; // Extract numeric value
                    conditionText = `${rounds} tours`;
                } else {
                    conditionText = condition; // Default fallback
                }
            } else {
                conditionText = 'condition'; // Default placeholder
            }

            structure.innerHTML = `<span>${action === 'if' ? 'If' : 'While'} (${conditionText || 'condition'})</span>`;
            const body = document.createElement('div');
            body.classList.add('structure-body');
            structure.appendChild(body);

            // Allow nested actions
            body.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.stopPropagation();
            });

            body.addEventListener('drop', (e) => {
                e.stopPropagation();
                e.preventDefault();
                const innerAction = e.dataTransfer.getData('action');
                if (innerAction) addActionToSchema(innerAction, body);
            });

            // Add nested actions if provided
            if (nestedActions) {
                nestedActions.forEach(nestedAction => 
                    addActionToSchema(nestedAction.action, body, nestedAction.nestedActions || null)
                );
            }

            container.appendChild(structure);

            // Skip popup if condition is provided
            if (!condition) {
                currentStructure = structure;
                structure.classList.add('temp-structure');
                toggleCompteurOption(action === 'while');
                clearConditionSelection();
                openConditionPopup();
            }
            break;
        }
    
        updateEndFlag();
    }        


    function getIconClass(action) {
        switch (action) {
            case 'avancer': return 'fa-arrow-up';
            case 'reculer': return 'fa-arrow-down';
            case 'tourner-gauche': return 'fa-arrow-left';
            case 'tourner-droite': return 'fa-arrow-right';
            case 'lumiere': return 'fa-lightbulb';
            case 'bruit': return 'fa-volume-up';
        }
    }

    function updateEndFlag() {
        const existingEnd = schemaPath.querySelector('.end');
        if (existingEnd) {
            existingEnd.remove();
        }

        const endFlag = document.createElement('i');
        endFlag.classList.add('fas', 'fa-flag', 'end');
        schemaPath.appendChild(endFlag);
    }

    function openConditionPopup() {
        conditionPopup.classList.remove('hidden');
        fullscreenOverlay.classList.remove('hidden');
        disableBackgroundInteraction();
    }

    function closeConditionPopup() {
        conditionPopup.classList.add('hidden');
        roundsInput.classList.add('hidden');
        counterInput.classList.add('hidden');
        fullscreenOverlay.classList.add('hidden');
        enableBackgroundInteraction();
    }

    function openEmptyPopup() {
        emptyPopup.classList.remove('hidden');
        fullscreenOverlay.classList.remove('hidden');
        disableBackgroundInteraction();
    }

    function closeEmptyPopup() {
        emptyPopup.classList.add('hidden');
        fullscreenOverlay.classList.add('hidden');
        enableBackgroundInteraction();
    }

    function clearConditionSelection() {
        document.querySelectorAll('.condition-buttons button').forEach((btn) => btn.classList.remove('selected'));
        confirmConditionBtn.disabled = true;
    }

    function toggleCompteurOption(show) {
        if (show) {
            counterBtn.style.display = 'inline-block'; // Show for "While"
        } else {
            counterBtn.style.display = 'none'; // Hide for "If"
            counterInput.classList.add('hidden');
        }
    }

    function setupEmptyPath() {
        const startPoint = document.createElement('div');
        startPoint.classList.add('start');
        schemaPath.appendChild(startPoint);
        updateEndFlag();
    }

    function disableBackgroundInteraction() {
        document.body.style.pointerEvents = 'none';
        conditionPopup.style.pointerEvents = 'auto'; // Allow popup interaction
        emptyPopup.style.pointerEvents = 'auto'; // Allow empty popup interaction
    }
    
    function enableBackgroundInteraction() {
        document.body.style.pointerEvents = ''; // Re-enable background
    }

    // Parse DSL content
    function parseDSL(dslText) {
        const lines = dslText.split('\n').map(line => line.trim()).filter(line => line);
        const parsedDSL = [];
        let index = 0;
    
        function parseBlock() {
            const actions = [];
            while (index < lines.length) {
                const line = lines[index];
                index++;
    
                if (line.startsWith('}')) {
                    break; // End of block
                } else if (line.startsWith('avancer')) {
                    const time = parseInt(line.match(/avancer (\d+);/)[1], 10);
                    actions.push({ action: 'avancer', time });
                } else if (line.startsWith('reculer')) {
                    const time = parseInt(line.match(/reculer (\d+);/)[1], 10);
                    actions.push({ action: 'reculer', time });
                } else if (line.startsWith('tourner')) {
                    const direction = line.match(/tourner (gauche|droite);/)[1];
                    actions.push({ action: `tourner-${direction}` });
                } else if (line.startsWith('lumiere')) {
                    actions.push({ action: 'lumiere' });
                } else if (line.startsWith('bruit')) {
                    actions.push({ action: 'bruit' });
                } else if (line.startsWith('while')) {
                    const condition = line.match(/\((.*?)\)/)[1];
                    actions.push({ action: 'while', nestedActions: parseBlock(), condition });
                } else if (line.startsWith('if')) {
                    const condition = line.match(/\((.*?)\)/)[1];
                    actions.push({ action: 'if', nestedActions: parseBlock(), condition });
                }
            }
            return actions;
        }
    
        while (index < lines.length) {
            const line = lines[index];
            if (line.startsWith('parcours')) {
                index++; // Skip the 'parcours' line
                parsedDSL.push(...parseBlock());
            } else {
                index++;
            }
        }
    
        return parsedDSL;
    }    
});
