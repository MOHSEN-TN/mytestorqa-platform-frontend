import { configureStore } from "@reduxjs/toolkit";
import projectReducer from "../slices/projectSlice";
import testCaseReducer from "../slices/testCaseSlice";
import testSuiteReducer from "../slices/testSuiteSlice";
import campaignReducer from "../slices/campaignSlice";
import iterationReducer from "../slices/iterationSlice";


export const store = configureStore({
  reducer: {
    projects: projectReducer,
    testSuites: testSuiteReducer,
    testCases: testCaseReducer,
    campaigns: campaignReducer,
    iterations: iterationReducer, 
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;