import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface CrawlSession {
  projectId: string;
  isCrawling: boolean;
  backgroundCrawling: boolean; // Add background crawling state
  currentAction: string;
  liveImageCount: number;
  liveLinkCount: number;
  liveInternalLinks: number;
  liveExternalLinks: number;
  livePagesCount: number;
  recentCrawledPages: any[];
  analyzedPages: any[];
  showImageAnalysis: boolean;
  showLinksAnalysis: boolean;
  crawlingStartedAt: number | null;
  lastUpdateAt: number | null;
  projectData?: any; // Store full project data
}

interface AuditState {
  sessions: Record<string, CrawlSession>;
  activeProjectId: string | null;
  globalIsCrawling: boolean;
}

const initialState: AuditState = {
  sessions: {},
  activeProjectId: null,
  globalIsCrawling: false,
};

export const auditSlice = createSlice({
  name: 'audit',
  initialState,
  reducers: {
    // Initialize or update a crawl session
    initializeSession: (state, action: PayloadAction<{ projectId: string; baseUrl?: string }>) => {
      const { projectId } = action.payload;
      if (!state.sessions[projectId]) {
        state.sessions[projectId] = {
          projectId,
          isCrawling: false,
          backgroundCrawling: false, // Initialize background crawling
          currentAction: '',
          liveImageCount: 0,
          liveLinkCount: 0,
          liveInternalLinks: 0,
          liveExternalLinks: 0,
          livePagesCount: 0,
          recentCrawledPages: [],
          analyzedPages: [],
          showImageAnalysis: false,
          showLinksAnalysis: false,
          crawlingStartedAt: null,
          lastUpdateAt: null,
        };
      }
      state.activeProjectId = projectId;
    },

    // Start crawling for a project
    startCrawling: (state, action: PayloadAction<{ projectId: string; background?: boolean }>) => {
      const { projectId, background = false } = action.payload;
      if (!state.sessions[projectId]) {
        state.sessions[projectId] = {
          projectId,
          isCrawling: false,
          backgroundCrawling: false,
          currentAction: '',
          liveImageCount: 0,
          liveLinkCount: 0,
          liveInternalLinks: 0,
          liveExternalLinks: 0,
          livePagesCount: 0,
          recentCrawledPages: [],
          analyzedPages: [],
          showImageAnalysis: false,
          showLinksAnalysis: false,
          crawlingStartedAt: null,
          lastUpdateAt: null,
        };
      }

      const session = state.sessions[projectId];
      session.isCrawling = !background; // Only set isCrawling to true if not background
      session.backgroundCrawling = background; // Set background crawling state
      session.currentAction = background ? 'Crawling in background...' : 'Crawling in progress...';
      session.crawlingStartedAt = Date.now();
      session.lastUpdateAt = Date.now();
      
      // Reset counts for recrawl
      session.liveImageCount = 0;
      session.liveLinkCount = 0;
      session.liveInternalLinks = 0;
      session.liveExternalLinks = 0;
      session.livePagesCount = 0;
      session.recentCrawledPages = [];
      session.analyzedPages = [];
      session.showImageAnalysis = false;
      session.showLinksAnalysis = false;

      state.activeProjectId = projectId;
      state.globalIsCrawling = true;
    },

    // Stop crawling for a project
    stopCrawling: (state, action: PayloadAction<{ projectId: string }>) => {
      const { projectId } = action.payload;
      const session = state.sessions[projectId];
      if (session) {
        session.isCrawling = false;
        session.backgroundCrawling = false; // Stop background crawling too
        session.currentAction = '';
        session.lastUpdateAt = Date.now();
      }
      state.globalIsCrawling = Object.values(state.sessions).some(s => s.isCrawling || s.backgroundCrawling);
    },

    // Update live counts for a project
    updateLiveCounts: (state, action: PayloadAction<{
      projectId: string;
      imageCount?: number;
      linkCount?: number;
      internalLinks?: number;
      externalLinks?: number;
      pagesCount?: number;
    }>) => {
      const { projectId, imageCount, linkCount, internalLinks, externalLinks, pagesCount } = action.payload;
      const session = state.sessions[projectId];
      if (session) {
        if (imageCount !== undefined) session.liveImageCount = imageCount;
        if (linkCount !== undefined) session.liveLinkCount = linkCount;
        if (internalLinks !== undefined) session.liveInternalLinks = internalLinks;
        if (externalLinks !== undefined) session.liveExternalLinks = externalLinks;
        if (pagesCount !== undefined) session.livePagesCount = pagesCount;
        session.lastUpdateAt = Date.now();
      }
    },

    // Update crawled pages for a project
    updateCrawledPages: (state, action: PayloadAction<{
      projectId: string;
      pages: any[];
    }>) => {
      const { projectId, pages } = action.payload;
      const session = state.sessions[projectId];
      if (session) {
        session.recentCrawledPages = pages;
        session.lastUpdateAt = Date.now();
      }
    },

    // Update analyzed pages for a project
    updateAnalyzedPages: (state, action: PayloadAction<{
      projectId: string;
      pages: any[];
    }>) => {
      const { projectId, pages } = action.payload;
      const session = state.sessions[projectId];
      if (session) {
        session.analyzedPages = pages;
        session.lastUpdateAt = Date.now();
      }
    },

    // Toggle analysis tables
    toggleImageAnalysis: (state, action: PayloadAction<{ projectId: string; show: boolean }>) => {
      const { projectId, show } = action.payload;
      const session = state.sessions[projectId];
      if (session) {
        session.showImageAnalysis = show;
      }
    },

    toggleLinksAnalysis: (state, action: PayloadAction<{ projectId: string; show: boolean }>) => {
      const { projectId, show } = action.payload;
      const session = state.sessions[projectId];
      if (session) {
        session.showLinksAnalysis = show;
      }
    },

    // Complete crawling for a project
    completeCrawling: (state, action: PayloadAction<{ projectId: string }>) => {
      const { projectId } = action.payload;
      const session = state.sessions[projectId];
      if (session) {
        session.isCrawling = false;
        session.backgroundCrawling = false; // Complete background crawling too
        session.currentAction = '';
        session.lastUpdateAt = Date.now();
      }
      state.globalIsCrawling = Object.values(state.sessions).some(s => s.isCrawling || s.backgroundCrawling);
    },

    // Set active project
    setActiveProject: (state, action: PayloadAction<{ projectId: string }>) => {
      state.activeProjectId = action.payload.projectId;
    },

    // Set project status
    setProjectStatus: (state, action: PayloadAction<{ 
      projectId: string; 
      status: string; 
      isCrawling?: boolean;
      currentAction?: string;
    }>) => {
      const { projectId, status, isCrawling, currentAction } = action.payload;
      const session = state.sessions[projectId];
      if (session) {
        if (isCrawling !== undefined) session.isCrawling = isCrawling;
        if (currentAction !== undefined) session.currentAction = currentAction;
        session.lastUpdateAt = Date.now();
      }
      state.globalIsCrawling = Object.values(state.sessions).some(s => s.isCrawling || s.backgroundCrawling);
    },

    // Update project data
    updateProjectData: (state, action: PayloadAction<{ 
      projectId: string; 
      projectData: any;
    }>) => {
      const { projectId, projectData } = action.payload;
      const session = state.sessions[projectId];
      if (session) {
        session.projectData = projectData;
        session.lastUpdateAt = Date.now();
      }
    },

    // Clear session data
    clearSession: (state, action: PayloadAction<{ projectId: string }>) => {
      const { projectId } = action.payload;
      delete state.sessions[projectId];
      if (state.activeProjectId === projectId) {
        state.activeProjectId = null;
      }
      state.globalIsCrawling = Object.values(state.sessions).some(s => s.isCrawling || s.backgroundCrawling);
    },

    // Clear all sessions
    clearAllSessions: (state) => {
      state.sessions = {};
      state.activeProjectId = null;
      state.globalIsCrawling = false;
    },
  },
});

export const {
  initializeSession,
  startCrawling,
  stopCrawling,
  updateLiveCounts,
  updateCrawledPages,
  updateAnalyzedPages,
  toggleImageAnalysis,
  toggleLinksAnalysis,
  completeCrawling,
  setActiveProject,
  setProjectStatus,
  updateProjectData,
  clearSession,
  clearAllSessions,
} = auditSlice.actions;

export default auditSlice.reducer; 