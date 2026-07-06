// src/store/useStore.js
import { create } from 'zustand'

export const useStore = create((set, get) => ({
  // ═══════════════════════════════════════════════════════════
  // APPLICATIONS PAGE
  // ═══════════════════════════════════════════════════════════
  apps: [],
  setApps: (apps) => set({ apps }),
  statusFilter: 'All Applications',
  setFilter: (filter) => set({ statusFilter: filter }),
  sortOption: 'Most Recent',
  setSort: (sort) => set({ sortOption: sort }),
  search: '',
  setSearch: (search) => set({ search }),
  page: 1,
  setPage: (page) => set({ page }),

  // ═══════════════════════════════════════════════════════════
  // COVER LETTER PAGE
  // ═══════════════════════════════════════════════════════════
  coverForm: {
    resume_id: '',
    job_title: '',
    company: '',
    job_description: '',
    job_url: '',
    location: '',
    tone: 'professional',
  },
  setCoverForm: (form) => set({ coverForm: form }),
  coverResult: null,
  setCoverResult: (result) => set({ coverResult: result }),
  savedLetters: [],
  setSavedLetters: (letters) => set({ savedLetters: letters }),
  viewLetter: null,
  setViewLetter: (letter) => set({ viewLetter: letter }),

  // ═══════════════════════════════════════════════════════════
  // SEMANTIC SEARCH PAGE
  // ═══════════════════════════════════════════════════════════
  semanticQuery: '',
  setSemanticQuery: (q) => set({ semanticQuery: q }),
  topK: 10,
  setTopK: (k) => set({ topK: k }),
  semanticResults: null,
  setSemanticResults: (results) => set({ semanticResults: results }),

  // ═══════════════════════════════════════════════════════════
  // RESUME PAGE (only extraSkills — rest is in ResumeContext)
  // ═══════════════════════════════════════════════════════════
  extraSkills: [],
  setExtraSkills: (skills) => set({ extraSkills: skills }),

  // ═══════════════════════════════════════════════════════════
  // OPTIMIZER PAGE
  // ═══════════════════════════════════════════════════════════
  optimizerJobDesc: '',
  setOptimizerJobDesc: (text) => set({ optimizerJobDesc: text }),
  optimizerResumeText: '',
  setOptimizerResumeText: (text) => set({ optimizerResumeText: text }),
  optimizerResult: null,
  setOptimizerResult: (result) => set({ optimizerResult: result }),

  // ═══════════════════════════════════════════════════════════
  // LINKEDIN PAGE
  // ═══════════════════════════════════════════════════════════
  linkedinHeadline: '',
  setLinkedinHeadline: (v) => set({ linkedinHeadline: v }),
  linkedinAbout: '',
  setLinkedinAbout: (v) => set({ linkedinAbout: v }),
  linkedinSkills: '',
  setLinkedinSkills: (v) => set({ linkedinSkills: v }),
  linkedinTargetRole: '',
  setLinkedinTargetRole: (v) => set({ linkedinTargetRole: v }),
  linkedinYearsExp: '',
  setLinkedinYearsExp: (v) => set({ linkedinYearsExp: v }),
  linkedinIndustry: '',
  setLinkedinIndustry: (v) => set({ linkedinIndustry: v }),
  linkedinResult: null,
  setLinkedinResult: (r) => set({ linkedinResult: r }),
  linkedinHeadlineResult: null,
  setLinkedinHeadlineResult: (r) => set({ linkedinHeadlineResult: r }),

  // ═══════════════════════════════════════════════════════════
  // JOB SEARCH PAGE
  // ═══════════════════════════════════════════════════════════
  searchLocation: '',
  setSearchLocation: (v) => set({ searchLocation: v }),
  timeFilter: 'any',
  setTimeFilter: (v) => set({ timeFilter: v }),
  jobResults: null,
  setJobResults: (j) => set({ jobResults: j }),
  searchMode: null,
  setSearchMode: (m) => set({ searchMode: m }),
  sortBy: 'final_score',
  setSortBy: (v) => set({ sortBy: v }),
  wantCoverLetters: false,
  setWantCoverLetters: (v) => set({ wantCoverLetters: v }),

  // ═══════════════════════════════════════════════════════════
  // INTERVIEW PAGE
  // ═══════════════════════════════════════════════════════════
  interviewGenJobTitle: '',
  setInterviewGenJobTitle: (v) => set({ interviewGenJobTitle: v }),
  interviewGenJobDesc: '',
  setInterviewGenJobDesc: (v) => set({ interviewGenJobDesc: v }),
  interviewGenSelectedTypes: ['Technical', 'Behavioral'],
  setInterviewGenTypes: (v) => set({ interviewGenSelectedTypes: v }),
  interviewGenNumQuestions: 8,
  setInterviewGenNumQuestions: (v) => set({ interviewGenNumQuestions: v }),
  interviewGenQuestions: [],
  setInterviewGenQuestions: (v) => set({ interviewGenQuestions: v }),

  interviewEvalQuestion: '',
  setInterviewEvalQuestion: (v) => set({ interviewEvalQuestion: v }),
  interviewEvalAnswer: '',
  setInterviewEvalAnswer: (v) => set({ interviewEvalAnswer: v }),
  interviewEvalType: 'behavioral',
  setInterviewEvalType: (v) => set({ interviewEvalType: v }),

  interviewStudyJobTitle: '',
  setInterviewStudyJobTitle: (v) => set({ interviewStudyJobTitle: v }),
  interviewStudyJobDesc: '',
  setInterviewStudyJobDesc: (v) => set({ interviewStudyJobDesc: v }),
  interviewStudyDays: 7,
  setInterviewStudyDays: (v) => set({ interviewStudyDays: v }),

  // ═══════════════════════════════════════════════════════════
  // HISTORY PAGE
  // ═══════════════════════════════════════════════════════════
  historyRecords: [],
  setHistoryRecords: (records) => set({ historyRecords: records }),
  historySort: 'Recent First',
  setHistorySort: (sort) => set({ historySort: sort }),

  // ═══════════════════════════════════════════════════════════
  // RESET ALL — called on logout
  // ═══════════════════════════════════════════════════════════
  resetAll: () => set({
    apps: [],
    statusFilter: 'All Applications',
    sortOption: 'Most Recent',
    search: '',
    page: 1,

    coverForm: {
      resume_id: '', job_title: '', company: '',
      job_description: '', job_url: '', location: '',
      tone: 'professional',
    },
    coverResult: null,
    savedLetters: [],
    viewLetter: null,

    semanticQuery: '',
    topK: 10,
    semanticResults: null,

    extraSkills: [],

    optimizerJobDesc: '',
    optimizerResumeText: '',
    optimizerResult: null,

    linkedinHeadline: '',
    linkedinAbout: '',
    linkedinSkills: '',
    linkedinTargetRole: '',
    linkedinYearsExp: '',
    linkedinIndustry: '',
    linkedinResult: null,
    linkedinHeadlineResult: null,

    searchLocation: '',
    timeFilter: 'any',
    jobResults: null,
    searchMode: null,
    sortBy: 'final_score',
    wantCoverLetters: false,

    interviewGenJobTitle: '',
    interviewGenJobDesc: '',
    interviewGenSelectedTypes: ['Technical', 'Behavioral'],
    interviewGenNumQuestions: 8,
    interviewGenQuestions: [],
    interviewEvalQuestion: '',
    interviewEvalAnswer: '',
    interviewEvalType: 'behavioral',
    interviewStudyJobTitle: '',
    interviewStudyJobDesc: '',
    interviewStudyDays: 7,

    historyRecords: [],
    historySort: 'Recent First',
  }),
}))