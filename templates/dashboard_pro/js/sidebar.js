const Sidebar = (function() {
    const { ref } = Vue;

    const currentPanel = ref(null);
    const sidebarOpen = ref(localStorage.getItem('dp_sidebarOpen') === 'true');
    const sidebarMini = ref(localStorage.getItem('dp_sidebarMini') === 'true');
    const expandedGroups = ref({});

    function childPanels(panels, groupName) {
        return panels.filter(p => p.parentGroup === groupName && p.panelType !== 'group');
    }

    function toggleGroup(name) {
        expandedGroups.value = { ...expandedGroups.value, [name]: !expandedGroups.value[name] };
    }

    function selectPanel(p) {
        currentPanel.value = p;
        if (p) localStorage.setItem('dp_lastPanel', p.name);
        if (window.__closeSettings) window.__closeSettings();
    }

    function selectHomePanel() {
        currentPanel.value = null;
        localStorage.removeItem('dp_lastPanel');
    }

    function toggleSidebar() {
        if (window.innerWidth <= 768) {
            sidebarOpen.value = !sidebarOpen.value;
            localStorage.setItem('dp_sidebarOpen', sidebarOpen.value);
        } else {
            sidebarMini.value = !sidebarMini.value;
            localStorage.setItem('dp_sidebarMini', sidebarMini.value);
        }
    }

    return { currentPanel, sidebarOpen, sidebarMini, expandedGroups, childPanels, toggleGroup, selectPanel, selectHomePanel, toggleSidebar };
})();
