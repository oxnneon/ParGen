document.addEventListener('DOMContentLoaded', () => {
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
    const fullscreenOverlay = document.getElementById('fullscreen-overlay'); // Added overlay
    const emptyPopup = document.getElementById('empty-popup');
    const closeEmptyPopupBtn = document.getElementById('close-popup');
    let currentStructure = null;

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
            addActionToSchema(action, schemaPath);
        }
    });

    actionList.querySelectorAll('li').forEach((actionItem) => {
        actionItem.addEventListener('click', () => {
            const action = actionItem.dataset.action;
            if (action) {
                addActionToSchema(action, schemaPath);
            }
        });
    });

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
        if (schemaPath.children.length > 2) {
            loaderContainer.classList.remove('hidden');
            setTimeout(() => {
                loaderContainer.classList.add('hidden');
                const swoosh = document.getElementById('swoosh');
                swoosh.classList.remove('hidden');
                swoosh.classList.add('animate');
                setTimeout(() => {
                    swoosh.classList.remove('animate');
                    swoosh.classList.add('hidden');
                }, 1000);
            }, 3000);
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
    function addActionToSchema(action, container) {
        let structure;

        switch (action) {
            case 'if':
            case 'while':
                structure = document.createElement('div');
                structure.classList.add('structure', action);
                structure.innerHTML = `<span>${action === 'if' ? 'If (condition)' : 'While (condition)'}</span>`;
                const body = document.createElement('div');
                body.classList.add('structure-body');
                structure.appendChild(body);

                body.addEventListener('dragover', (e) => e.preventDefault());
                body.addEventListener('drop', (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    const innerAction = e.dataTransfer.getData('action');
                    if (innerAction) addActionToSchema(innerAction, body);
                });

                container.appendChild(structure);
                currentStructure = structure;
                structure.classList.add('temp-structure');
                toggleCompteurOption(action === 'while');
                clearConditionSelection();
                openConditionPopup();
                break;
        }

        updateEndFlag();
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
        conditionPopup.style.pointerEvents = 'auto';
        emptyPopup.style.pointerEvents = 'auto';
    }

    function enableBackgroundInteraction() {
        document.body.style.pointerEvents = '';
    }
});
