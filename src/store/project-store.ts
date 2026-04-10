// Zustand store for project and chat state management

import { create } from 'zustand';
import { ChatMessage, ProjectStatus } from '@/types/chat';
import { BriefData, EMPTY_BRIEF } from '@/types/brief';
import { StrategyData, EMPTY_STRATEGY } from '@/types/strategy';
import { CopyData } from '@/types/copy';
import { ProjectListItem } from '@/types/project';

interface ProjectStore {
  // Project list
  projects: ProjectListItem[];
  loadingProjects: boolean;
  setProjects: (projects: ProjectListItem[]) => void;
  setLoadingProjects: (loading: boolean) => void;

  // Current project
  currentProjectId: string | null;
  status: ProjectStatus;
  briefData: BriefData;
  strategyData: StrategyData;
  copyData: CopyData | null;
  htmlContent: string | null;
  activeVersion: number;
  archetype: string | null;

  // Chat
  messages: ChatMessage[];
  isSending: boolean;
  isGenerating: boolean;

  // Tab state
  activeTab: 'html' | 'design' | 'strategy' | 'copy';

  // Actions
  setCurrentProject: (id: string | null) => void;
  setStatus: (status: ProjectStatus) => void;
  setBriefData: (brief: BriefData) => void;
  setStrategyData: (strategy: StrategyData) => void;
  setCopyData: (copy: CopyData | null) => void;
  setHtmlContent: (html: string | null) => void;
  setActiveVersion: (version: number) => void;
  setArchetype: (archetype: string | null) => void;
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  setIsSending: (sending: boolean) => void;
  setIsGenerating: (generating: boolean) => void;
  setActiveTab: (tab: 'html' | 'design' | 'strategy' | 'copy') => void;
  resetProject: () => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  // Project list
  projects: [],
  loadingProjects: false,
  setProjects: (projects) => set({ projects }),
  setLoadingProjects: (loadingProjects) => set({ loadingProjects }),

  // Current project
  currentProjectId: null,
  status: 'welcome',
  briefData: { ...EMPTY_BRIEF },
  strategyData: { ...EMPTY_STRATEGY },
  copyData: null,
  htmlContent: null,
  activeVersion: 0,
  archetype: null,

  // Chat
  messages: [],
  isSending: false,
  isGenerating: false,

  // Tab
  activeTab: 'strategy',

  // Actions
  setCurrentProject: (id) => set({ currentProjectId: id }),
  setStatus: (status) => set({ status }),
  setBriefData: (briefData) => set({ briefData }),
  setStrategyData: (strategyData) => set({ strategyData }),
  setCopyData: (copyData) => set({ copyData }),
  setHtmlContent: (htmlContent) => set({ htmlContent }),
  setActiveVersion: (activeVersion) => set({ activeVersion }),
  setArchetype: (archetype) => set({ archetype }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setIsSending: (isSending) => set({ isSending }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setActiveTab: (activeTab) => set({ activeTab }),
  resetProject: () =>
    set({
      currentProjectId: null,
      status: 'welcome',
      briefData: { ...EMPTY_BRIEF },
      strategyData: { ...EMPTY_STRATEGY },
      copyData: null,
      htmlContent: null,
      activeVersion: 0,
      archetype: null,
      messages: [],
      isSending: false,
      isGenerating: false,
      activeTab: 'html',
    }),
}));
