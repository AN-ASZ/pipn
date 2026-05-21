let dummyTabId = null;
let originalTabId = null;
let originalWindowId = null;
let pendingLoss = false;
let cleanupTimer = null;

async function handleFocusLoss() {
	pendingLoss = true;

	const currentTab = await browser.tabs.query({ active: true, currentWindow: true });
	if (!currentTab[0]) return;
	if (!pendingLoss) return;

	const window = await browser.windows.get(currentTab[0].windowId);
	if (window.state !== "minimized") return;
	if (!pendingLoss) return;

	originalTabId = currentTab[0].id;
	originalWindowId = currentTab[0].windowId;

	const dummyTab = await browser.tabs.create({
		url: "about:blank",
		active: true,
	});
	dummyTabId = dummyTab.id;

	startCleanupPoll();
}

function startCleanupPoll() {
	stopCleanupPoll();

	async function poll() {
		if (dummyTabId === null || originalWindowId === null) return;

		try {
			const win = await browser.windows.get(originalWindowId);
			if (win.state !== "minimized") {
				await cleanupDummy();
				return;
			}
		} catch {
			return;
		}

		cleanupTimer = setTimeout(poll, 2000);
	}

	cleanupTimer = setTimeout(poll, 2000);
}

function stopCleanupPoll() {
	if (cleanupTimer !== null) {
		clearTimeout(cleanupTimer);
		cleanupTimer = null;
	}
}

async function handleFocusGain(windowId: number) {
	pendingLoss = false;
	if (originalWindowId !== null && windowId !== originalWindowId) return;
	await cleanupDummy();
}

async function cleanupDummy() {
	if (dummyTabId === null) return;

	stopCleanupPoll();

	const dId = dummyTabId;
	const oId = originalTabId;
	dummyTabId = null;
	originalTabId = null;
	originalWindowId = null;

	try {
		await browser.tabs.remove(dId);
	} catch {
		// Dummy tab was already closed
	}

	try {
		await browser.tabs.get(oId);
		await browser.tabs.update(oId, { active: true });
	} catch {
		// Original tab was closed
	}
}

browser.windows.onFocusChanged.addListener(async (windowId) => {
	if (windowId === browser.windows.WINDOW_ID_NONE) {
		await handleFocusLoss();
	} else {
		await handleFocusGain(windowId);
	}
});

browser.tabs.onActivated.addListener((activeInfo) => {
	if (dummyTabId === null) return;
	if (originalWindowId !== null && activeInfo.windowId !== originalWindowId) return;
	if (activeInfo.tabId !== dummyTabId) {
		cleanupDummy();
	}
});

browser.tabs.onRemoved.addListener((tabId) => {
	if (tabId === dummyTabId) {
		stopCleanupPoll();
		dummyTabId = null;
		originalTabId = null;
		originalWindowId = null;
	}
});

browser.windows.onBoundsChanged.addListener(async (windowId) => {
	if (dummyTabId === null) return;
	if (originalWindowId !== null && windowId !== originalWindowId) return;

	const win = await browser.windows.get(windowId);
	if (win.state === "normal" && win.focused) {
		await cleanupDummy();
	}
});
