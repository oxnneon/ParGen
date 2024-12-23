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
    let currentStructure = null; // Track the current structure being edited

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
            const conditionText = selectedCondition.id === 'no-noise' ? 'Pas de bruit' : 'Pas d\'obstacle';
            currentStructure.querySelector('span').textContent = `${currentStructure.classList.contains('if') ? 'If' : 'While'} (${conditionText})`;
            currentStructure.classList.remove('temp-structure'); // Finalize structure
            closeConditionPopup();
        }
    });

    cancelConditionBtn.addEventListener('click', closeConditionPopup);

    clearSchemaBtn.addEventListener('click', () => {
        schemaPath.innerHTML = '';
    });

    generateCodeBtn.addEventListener('click', () => {
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
    });

    document.querySelectorAll('.condition-buttons button').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.condition-buttons button').forEach((b) => b.classList.remove('selected'));
            btn.classList.add('selected');
            confirmConditionBtn.disabled = false;
        });
    });
});

/*
    Functions
*/
function addActionToSchema(action, container) {
    if (container === schemaPath && schemaPath.children.length === 0) {
        const startPoint = document.createElement('div');
        startPoint.classList.add('start');
        schemaPath.appendChild(startPoint);
    }

    let structure;

    switch (action) {
        case 'avancer':
        case 'reculer':
        case 'tourner-gauche':
        case 'tourner-droite':
        case 'lumiere':
        case 'bruit':
            const icon = document.createElement('i');
            icon.classList.add('fas', getIconClass(action));
            container.appendChild(icon);
            break;

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
                if (innerAction) {
                    addActionToSchema(innerAction, body);
                }
            });

            container.appendChild(structure);
            currentStructure = structure;

            // Mark structure as temporary
            structure.classList.add('temp-structure');

            // Clear previously selected conditions
            clearConditionSelection();

            conditionPopup.classList.remove('hidden');
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

function closeConditionPopup() {
    conditionPopup.classList.add('hidden');
    if (currentStructure && currentStructure.classList.contains('temp-structure')) {
        // Remove temporary structure
        currentStructure.remove();
    }
    currentStructure = null;
}

function clearConditionSelection() {
    document.querySelectorAll('.condition-buttons button').forEach((btn) => btn.classList.remove('selected'));
    confirmConditionBtn.disabled = true; // Disable the confirm button until a condition is selected
}