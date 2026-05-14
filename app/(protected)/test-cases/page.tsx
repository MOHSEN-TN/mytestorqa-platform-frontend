"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store/hooks";
import { fetchProjects, setSelectedProject } from "@/lib/slices/projectSlice";
import {
  clearTestSuites,
  createTestSuite,
  deleteTestSuite,
  duplicateTestSuite,
  fetchTestSuites,
  setSelectedSuite,
  updateTestSuite,
} from "@/lib/slices/testSuiteSlice";
import {
  clearTestCases,
  createTestCase,
  deleteTestCase,
  duplicateTestCase,
  fetchTestCases,
  TestCase,
  TestStep,
  updateTestCase,
} from "@/lib/slices/testCaseSlice";
import { useSelector } from "react-redux";
import { RootState } from "@/lib/store";

type StepForm = {
  action: string;
  expected: string;
};

export default function TestCasesPage() {
  const dispatch = useAppDispatch();
  const fullscreenRef = useRef<HTMLDivElement | null>(null);

  const {
    projects,
    loading: loadingProjects,
    selectedProject,
    error: projectError,
  } = useAppSelector((state) => state.projects);

  const {
    testSuites,
    selectedSuite,
    loading: loadingSuites,
    creating: creatingSuite,
    updating: updatingSuite,
    deleting: deletingSuite,
    error: suiteError,
  } = useAppSelector((state) => state.testSuites);

  const {
    testCases,
    loading: loadingTestCases,
    creating,
    updating,
    deleting,
    error: testCaseError,
  } = useAppSelector((state) => state.testCases);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [collapsedProjects, setCollapsedProjects] = useState(false);
  const [collapsedSuites, setCollapsedSuites] = useState(false);

  const [isCreateSuiteOpen, setIsCreateSuiteOpen] = useState(false);
  const [suiteName, setSuiteName] = useState("");
  const [suiteDescription, setSuiteDescription] = useState("");

  const [editingSuite, setEditingSuite] = useState<{
    id: string;
    name: string;
    description?: string | null;
  } | null>(null);
  const [editSuiteName, setEditSuiteName] = useState("");
  const [editSuiteDescription, setEditSuiteDescription] = useState("");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createExpected, setCreateExpected] = useState("");
  const [createStatus, setCreateStatus] = useState<
    "DRAFT" | "READY" | "DEPRECATED"
  >("DRAFT");
  const [createPriority, setCreatePriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  >("MEDIUM");
  const [createSteps, setCreateSteps] = useState<StepForm[]>([
    { action: "", expected: "" },
  ]);

  const testCaseList = useSelector((item: RootState) => item.testCases.testCases)
  console.log("testCaseList ",testCaseList);
  
  const [editingTestCase, setEditingTestCase] = useState<TestCase | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editExpected, setEditExpected] = useState("");
  const [editStatus, setEditStatus] = useState<"DRAFT" | "READY" | "DEPRECATED">(
    "DRAFT"
  );
  const [editPriority, setEditPriority] = useState<
    "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  >("MEDIUM");
  const [editSteps, setEditSteps] = useState<StepForm[]>([
    { action: "", expected: "" },
  ]);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    if (!selectedProject?.id) {
      dispatch(clearTestSuites());
      dispatch(clearTestCases());
      return;
    }

    dispatch(fetchTestSuites(selectedProject.id));
    dispatch(clearTestCases());
  }, [dispatch, selectedProject?.id]);

  useEffect(() => {
    if (!selectedSuite?.id) {
      dispatch(clearTestCases());
      return;
    }
    console.log("helloooo ");
    
    dispatch(fetchTestCases({suiteId: selectedSuite.id, status: statusFilter, priority: priorityFilter}));
  }, [dispatch, selectedSuite?.id, statusFilter, priorityFilter]);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  const resetFiltersPage = () => {
    setCurrentPage(1);
    setExpandedId(null);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    resetFiltersPage();
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    resetFiltersPage();
  };

  const handlePriorityFilterChange = (value: string) => {
    setPriorityFilter(value);
    resetFiltersPage();
  };

  const totalPages = Math.max(
    1,
    Math.ceil(testCaseList.length / itemsPerPage)
  );

  const paginatedTestCases = testCaseList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const globalError = projectError || suiteError || testCaseError;

  const getStatusClass = (status: string) => {
    switch (status) {
      case "READY":
        return "bg-green-100 text-green-700 border-green-200";
      case "DRAFT":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "DEPRECATED":
        return "bg-gray-200 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getPriorityClass = (priority: string) => {
    switch (priority) {
      case "CRITICAL":
        return "bg-red-100 text-red-700 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "MEDIUM":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "LOW":
        return "bg-gray-100 text-gray-700 border-gray-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await fullscreenRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Erreur fullscreen:", error);
    }
  };

  const resetCreateSuiteForm = () => {
    setSuiteName("");
    setSuiteDescription("");
  };

  const openCreateSuiteModal = () => {
    resetCreateSuiteForm();
    setIsCreateSuiteOpen(true);
  };

  const closeCreateSuiteModal = () => {
    setIsCreateSuiteOpen(false);
    resetCreateSuiteForm();
  };

  const openEditSuiteModal = (suite: {
    id: string;
    name: string;
    description?: string | null;
  }) => {
    setEditingSuite(suite);
    setEditSuiteName(suite.name);
    setEditSuiteDescription(suite.description ?? "");
  };

  const closeEditSuiteModal = () => {
    setEditingSuite(null);
    setEditSuiteName("");
    setEditSuiteDescription("");
  };

  const resetCreateForm = () => {
    setCreateTitle("");
    setCreateDescription("");
    setCreateExpected("");
    setCreateStatus("DRAFT");
    setCreatePriority("MEDIUM");
    setCreateSteps([{ action: "", expected: "" }]);
  };

  const openCreateModal = () => {
    resetCreateForm();
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    resetCreateForm();
  };

  const handleCreateStepChange = (
    index: number,
    field: "action" | "expected",
    value: string
  ) => {
    setCreateSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, [field]: value } : step))
    );
  };

  const addCreateStep = () => {
    setCreateSteps((prev) => [...prev, { action: "", expected: "" }]);
  };

  const removeCreateStep = (index: number) => {
    setCreateSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateSuite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedProject?.id) return;
    if (!suiteName.trim()) return;

    const resultAction = await dispatch(
      createTestSuite({
        projectId: selectedProject.id,
        name: suiteName.trim(),
        description: suiteDescription.trim() || undefined,
      })
    );

    if (createTestSuite.fulfilled.match(resultAction)) {
      closeCreateSuiteModal();
      dispatch(fetchTestSuites(selectedProject.id));
    }
  };

  const handleUpdateSuite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!editingSuite || !editSuiteName.trim() || !selectedProject?.id) return;

    const resultAction = await dispatch(
      updateTestSuite({
        suiteId: editingSuite.id,
        name: editSuiteName.trim(),
        description: editSuiteDescription.trim() || undefined,
      })
    );

    if (updateTestSuite.fulfilled.match(resultAction)) {
      closeEditSuiteModal();
      dispatch(fetchTestSuites(selectedProject.id));
    }
  };

  const handleDeleteSuite = async (suiteId: string) => {
    if (!selectedProject?.id) return;

    const confirmed = window.confirm("Supprimer cette suite ?");
    if (!confirmed) return;

    const resultAction = await dispatch(deleteTestSuite(suiteId));

    if (deleteTestSuite.fulfilled.match(resultAction)) {
      dispatch(fetchTestSuites(selectedProject.id));
      dispatch(clearTestCases());
    }
  };

  const handleDuplicateSuite = async (suiteId: string) => {
    if (!selectedProject?.id) return;

    const resultAction = await dispatch(duplicateTestSuite(suiteId));

    if (duplicateTestSuite.fulfilled.match(resultAction)) {
      dispatch(fetchTestSuites(selectedProject.id));
    }
  };

  const handleCreateTestCase = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedSuite?.id) return;
    if (!createTitle.trim()) return;

    const cleanedSteps = createSteps
      .map((step) => ({
        action: step.action.trim(),
        expected: step.expected.trim() || undefined,
      }))
      .filter((step) => step.action !== "");

    const resultAction = await dispatch(
      createTestCase({
        suiteId: selectedSuite.id,
        title: createTitle.trim(),
        description: createDescription.trim() || undefined,
        expected: createExpected.trim() || undefined,
        status: createStatus,
        priority: createPriority,
        steps: cleanedSteps.length ? cleanedSteps : undefined,
      })
    );

    if (createTestCase.fulfilled.match(resultAction)) {
      closeCreateModal();
      dispatch(fetchTestCases({suiteId: selectedSuite.id, status: statusFilter, priority: priorityFilter}));
    }
  };

  const handleDuplicate = async (testCaseId: string) => {
    if (!selectedSuite?.id) return;

    const resultAction = await dispatch(
      duplicateTestCase({
        suiteId: selectedSuite.id,
        testCaseId,
      })
    );

    if (duplicateTestCase.fulfilled.match(resultAction)) {
      dispatch(fetchTestCases({suiteId: selectedSuite.id, status: statusFilter, priority: priorityFilter}));
    }
  };

  const openEditModal = (testCase: TestCase) => {
    setEditingTestCase(testCase);
    setEditTitle(testCase.title);
    setEditDescription(testCase.description ?? "");
    setEditExpected(testCase.expected ?? "");
    setEditStatus(testCase.status);
    setEditPriority(testCase.priority);
    setEditSteps(
      testCase.steps?.length
        ? testCase.steps.map((step) => ({
            action: step.action ?? "",
            expected: step.expected ?? "",
          }))
        : [{ action: "", expected: "" }]
    );
  };

  const closeEditModal = () => {
    setEditingTestCase(null);
    setEditTitle("");
    setEditDescription("");
    setEditExpected("");
    setEditStatus("DRAFT");
    setEditPriority("MEDIUM");
    setEditSteps([{ action: "", expected: "" }]);
  };

  const handleEditStepChange = (
    index: number,
    field: "action" | "expected",
    value: string
  ) => {
    setEditSteps((prev) =>
      prev.map((step, i) => (i === index ? { ...step, [field]: value } : step))
    );
  };

  const addEditStep = () => {
    setEditSteps((prev) => [...prev, { action: "", expected: "" }]);
  };

  const removeEditStep = (index: number) => {
    setEditSteps((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!selectedSuite?.id || !editingTestCase) return;
    if (!editTitle.trim()) return;

    const cleanedSteps = editSteps
      .map((step) => ({
        action: step.action.trim(),
        expected: step.expected.trim() || undefined,
      }))
      .filter((step) => step.action !== "");

    const resultAction = await dispatch(
      updateTestCase({
        suiteId: selectedSuite.id,
        testCaseId: editingTestCase.id,
        title: editTitle.trim(),
        description: editDescription.trim() || undefined,
        expected: editExpected.trim() || undefined,
        status: editStatus,
        priority: editPriority,
        steps: cleanedSteps.length ? cleanedSteps : undefined,
      })
    );

    if (updateTestCase.fulfilled.match(resultAction)) {
      closeEditModal();
      dispatch(fetchTestCases({suiteId: selectedSuite.id, status: statusFilter, priority: priorityFilter}));
    }
  };

  const handleDelete = async (testCaseId: string) => {
    if (!selectedSuite?.id) return;

    const confirmed = window.confirm("Supprimer ce test case ?");
    if (!confirmed) return;

    const resultAction = await dispatch(
      deleteTestCase({
        suiteId: selectedSuite.id,
        testCaseId,
      })
    );

    if (deleteTestCase.fulfilled.match(resultAction)) {
      dispatch(fetchTestCases({suiteId: selectedSuite.id, status: statusFilter, priority: priorityFilter}));
    }
  };

  const projectColumnClass = collapsedProjects
    ? "hidden"
    : isFullscreen
    ? "xl:col-span-2"
    : "xl:col-span-3";

  const suiteColumnClass = collapsedSuites
    ? "hidden"
    : isFullscreen
    ? "xl:col-span-3"
    : "xl:col-span-3";

  const testCasesColumnClass = (() => {
    if (collapsedProjects && collapsedSuites) return "xl:col-span-12";
    if (collapsedProjects) return isFullscreen ? "xl:col-span-9" : "xl:col-span-9";
    if (collapsedSuites) return isFullscreen ? "xl:col-span-10" : "xl:col-span-9";
    return isFullscreen ? "xl:col-span-7" : "xl:col-span-6";
  })();

  const arrowButtonClass =
    "absolute -left-5 z-20 h-10 w-10 cursor-pointer rounded-full shadow-md";

  if (loadingProjects) {
    return <div className="p-6">Chargement des projets...</div>;
  }
console.log("testCaseList ", testCaseList);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Test Management</h1>
          <p className="mt-1 text-gray-600">Projet → Suites → Cas de test</p>
        </div>

        <button
          type="button"
          onClick={toggleFullscreen}
          className="rounded border bg-white px-4 py-2 text-sm shadow-sm hover:bg-gray-50"
        >
          {isFullscreen ? "Quitter plein écran" : "Plein écran"}
        </button>
      </div>

      {globalError && (
        <div className="rounded border border-red-300 bg-red-50 p-3 text-red-700">
          {globalError}
        </div>
      )}

      <div
        ref={fullscreenRef}
        className={`${
          isFullscreen ? "overflow-auto bg-white p-6" : ""
        }`}
      >
        {isFullscreen && (
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Vue plein écran</h2>
              <p className="text-sm text-gray-500">
                Appuie sur Échap ou utilise le bouton pour quitter.
              </p>
            </div>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="rounded border bg-white px-4 py-2 text-sm shadow-sm hover:bg-gray-50"
            >
              Fermer
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <section
            className={`min-w-0 rounded-lg border bg-white p-4 shadow-sm ${projectColumnClass}`}
          >
            <h2 className="mb-4 text-lg font-semibold">Projects</h2>

            {projects.length === 0 ? (
              <p>Aucun projet trouvé.</p>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => {
                  const isSelected = selectedProject?.id === project.id;

                  return (
                    <button
                      key={project.id}
                      type="button"
                      onClick={() => dispatch(setSelectedProject(project))}
                      className={`w-full rounded border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-700"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="font-medium break-words">{project.name}</div>
                      <div className="text-sm text-gray-500">
                        {project.createdAt
                          ? new Date(project.createdAt).toLocaleString()
                          : "-"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section
            className={`relative min-w-0 rounded-lg border bg-white p-4 shadow-sm ${suiteColumnClass}`}
          >
            <Image
              src={
                collapsedProjects
                  ? "/images/icon2.png"
                  : "/images/icon1.png"
              }
              alt={collapsedProjects ? "Ouvrir Projects" : "Fermer Projects"}
              title={collapsedProjects ? "Ouvrir Projects" : "Fermer Projects"}
              width={40}
              height={40}
              onClick={() => setCollapsedProjects((prev) => !prev)}
              className={`${arrowButtonClass} top-12 hidden xl:block`}
            />
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Test Suites</h2>
              <button
                type="button"
                className="rounded bg-green-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                disabled={!selectedProject}
                onClick={openCreateSuiteModal}
              >
                New Suite
              </button>
            </div>

            {!selectedProject ? (
              <p className="text-gray-500">Choisis d’abord un projet.</p>
            ) : loadingSuites ? (
              <p>Chargement des suites...</p>
            ) : testSuites.length === 0 ? (
              <p>Aucune suite trouvée.</p>
            ) : (
              <div className="space-y-2">
                {testSuites.map((suite) => {
                  const isSelected = selectedSuite?.id === suite.id;

                  return (
                    <div
                      key={suite.id}
                      className={`w-full rounded border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="font-medium break-words">{suite.name}</div>
                      <div className="text-sm text-gray-500 break-words">
                        {suite.description || "No description"}
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => dispatch(setSelectedSuite(suite))}
                          className="rounded bg-slate-700 px-3 py-1 text-xs text-white"
                        >
                          {isSelected ? "Active" : "Choisir"}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditSuiteModal(suite)}
                          className="rounded bg-yellow-500 px-3 py-1 text-xs text-white"
                        >
                          Modify
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicateSuite(suite.id)}
                          className="rounded bg-indigo-600 px-3 py-1 text-xs text-white"
                        >
                          Duplicate
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSuite(suite.id)}
                          disabled={deletingSuite}
                          className="rounded bg-red-600 px-3 py-1 text-xs text-white disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section
            className={`relative min-w-0 rounded-lg border bg-white p-4 shadow-sm ${testCasesColumnClass}`}
          >
            <Image
              src={
                collapsedSuites
                  ? "/images/icon2.png"
                  : "/images/icon1.png"
              }
              alt={collapsedSuites ? "Ouvrir Test Suites" : "Fermer Test Suites"}
              title={collapsedSuites ? "Ouvrir Test Suites" : "Fermer Test Suites"}
              width={40}
              height={40}
              onClick={() => setCollapsedSuites((prev) => !prev)}
              className={`${arrowButtonClass} ${collapsedSuites ? "top-24" : "top-12"} hidden xl:block`}
            />
            <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:flex-wrap xl:items-center">
              <input
                type="text"
                placeholder="Recherche par titre ou description"
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="min-w-0 flex-1 rounded border px-3 py-2"
                disabled={!selectedSuite}
              />

              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="rounded border px-3 py-2"
                disabled={!selectedSuite}
              >
                <option value="ALL">Tous statuts</option>
                <option value="DRAFT">DRAFT</option>
                <option value="READY">READY</option>
                <option value="DEPRECATED">DEPRECATED</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => handlePriorityFilterChange(e.target.value)}
                className="rounded border px-3 py-2"
                disabled={!selectedSuite}
              >
                <option value="ALL">Toutes priorités</option>
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>

              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="rounded border px-3 py-2"
                disabled={!selectedSuite}
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>

              <button
                type="button"
                className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
                disabled={!selectedSuite}
                onClick={openCreateModal}
              >
                New Test Case
              </button>
            </div>

            <div className="mb-4 min-w-0">
              <h2 className="truncate text-xl font-semibold">
                {selectedSuite ? `Test Cases — ${selectedSuite.name}` : "Test Cases"}
              </h2>
              <p className="text-sm text-gray-500">
                {selectedProject
                  ? `Projet actif : ${selectedProject.name}`
                  : "Aucun projet sélectionné"}
              </p>
            </div>

            {!selectedSuite ? (
              <p className="text-gray-500">
                Choisis une suite pour afficher ses cas de test.
              </p>
            ) : loadingTestCases ? (
              <p>Chargement des cas de test...</p>
            ) : testCaseList.length === 0 ? (
              <p>Aucun cas de test trouvé.</p>
            ) : (
              <div className="space-y-4">
                {paginatedTestCases.map((testCase, index) => (
                  <div
                    key={testCase.id}
                    className={`rounded border ${
                      expandedId === testCase.id
                        ? "border-blue-300 bg-blue-50"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 p-4">
                      <div className="flex min-w-0 flex-1 items-start gap-3">
                        <button
                          type="button"
                          onClick={() => toggleExpand(testCase.id)}
                          className="mt-1 flex h-8 w-8 items-center justify-center rounded border text-sm hover:bg-gray-100"
                        >
                          {expandedId === testCase.id ? "▾" : "▸"}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                              {(currentPage - 1) * itemsPerPage + index + 1}
                            </span>
                            <h3 className="min-w-0 truncate text-xl font-semibold">
                              {testCase.title}
                            </h3>
                          </div>

                          <p className="mt-1 break-words text-gray-600">
                            {testCase.description || "Pas de description"}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-2 py-1 text-xs font-medium ${getStatusClass(
                                testCase.status
                              )}`}
                            >
                              {testCase.status}
                            </span>

                            <span
                              className={`rounded-full border px-2 py-1 text-xs font-medium ${getPriorityClass(
                                testCase.priority
                              )}`}
                            >
                              {testCase.priority}
                            </span>

                            <span className="text-sm text-gray-500">
                              {testCase.steps?.length || 0} step(s)
                            </span>

                            <span className="text-sm text-gray-500">
                              {new Date(testCase.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => toggleExpand(testCase.id)}
                          className="rounded bg-slate-700 px-3 py-2 text-sm text-white"
                        >
                          {expandedId === testCase.id ? "Réduire" : "Voir"}
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(testCase)}
                          className="rounded bg-yellow-500 px-3 py-2 text-sm text-white"
                        >
                          Modify
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDuplicate(testCase.id)}
                          className="rounded bg-indigo-600 px-3 py-2 text-sm text-white"
                        >
                          Duplicate
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(testCase.id)}
                          disabled={deleting}
                          className="rounded bg-red-600 px-3 py-2 text-sm text-white disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    {expandedId === testCase.id && (
                      <div className="border-t bg-gray-50 p-4">
                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                          <div className="rounded border bg-white p-4">
                            <h4 className="mb-2 font-semibold">Description</h4>
                            <p className="break-words text-gray-700">
                              {testCase.description || "-"}
                            </p>
                          </div>

                          <div className="rounded border bg-white p-4">
                            <h4 className="mb-2 font-semibold">Expected global result</h4>
                            <p className="break-words text-gray-700">
                              {testCase.expected || "-"}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 rounded border bg-white p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <h4 className="font-semibold">Test Steps</h4>
                            <div className="text-sm text-gray-500">
                              Updated: {new Date(testCase.updatedAt).toLocaleString()}
                            </div>
                          </div>

                          {testCase.steps?.length ? (
                            <div className="overflow-x-auto">
                              <table className="min-w-full border">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="border px-3 py-2 text-left">#</th>
                                    <th className="border px-3 py-2 text-left">Action</th>
                                    <th className="border px-3 py-2 text-left">
                                      Expected result
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {testCase.steps.map((step: TestStep) => (
                                    <tr key={step.id}>
                                      <td className="border px-3 py-2">
                                        {step.stepOrder}
                                      </td>
                                      <td className="border px-3 py-2">{step.action}</td>
                                      <td className="border px-3 py-2">
                                        {step.expected || "-"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-500">Aucun step</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-gray-600">
                    {testCaseList.length} résultat(s)
                  </p>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="rounded border px-3 py-1 disabled:opacity-50"
                    >
                      Précédent
                    </button>

                    <span className="text-sm">
                      Page {currentPage} / {totalPages}
                    </span>

                    <button
                      type="button"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="rounded border px-3 py-1 disabled:opacity-50"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

      {isCreateSuiteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Créer une suite</h2>
              <button
                type="button"
                onClick={closeCreateSuiteModal}
                className="rounded border px-3 py-1"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleCreateSuite} className="space-y-4">
              <input
                type="text"
                placeholder="Nom de la suite"
                value={suiteName}
                onChange={(e) => setSuiteName(e.target.value)}
                className="w-full rounded border px-3 py-2"
              />

              <textarea
                placeholder="Description"
                value={suiteDescription}
                onChange={(e) => setSuiteDescription(e.target.value)}
                className="w-full rounded border px-3 py-2"
                rows={3}
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreateSuiteModal}
                  className="rounded border px-4 py-2"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={creatingSuite}
                  className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {creatingSuite ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingSuite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Modifier la suite</h2>
              <button
                type="button"
                onClick={closeEditSuiteModal}
                className="rounded border px-3 py-1"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleUpdateSuite} className="space-y-4">
              <input
                type="text"
                placeholder="Nom de la suite"
                value={editSuiteName}
                onChange={(e) => setEditSuiteName(e.target.value)}
                className="w-full rounded border px-3 py-2"
              />

              <textarea
                placeholder="Description"
                value={editSuiteDescription}
                onChange={(e) => setEditSuiteDescription(e.target.value)}
                className="w-full rounded border px-3 py-2"
                rows={3}
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditSuiteModal}
                  className="rounded border px-4 py-2"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={updatingSuite}
                  className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {updatingSuite ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Créer un test case</h2>
              <button
                type="button"
                onClick={closeCreateModal}
                className="rounded border px-3 py-1"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleCreateTestCase} className="space-y-4">
              <input
                type="text"
                placeholder="Titre du test case"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                className="w-full rounded border px-3 py-2"
              />

              <textarea
                placeholder="Description"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                className="w-full rounded border px-3 py-2"
                rows={3}
              />

              <textarea
                placeholder="Expected global result"
                value={createExpected}
                onChange={(e) => setCreateExpected(e.target.value)}
                className="w-full rounded border px-3 py-2"
                rows={2}
              />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <select
                  value={createStatus}
                  onChange={(e) =>
                    setCreateStatus(
                      e.target.value as "DRAFT" | "READY" | "DEPRECATED"
                    )
                  }
                  className="rounded border px-3 py-2"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="READY">READY</option>
                  <option value="DEPRECATED">DEPRECATED</option>
                </select>

                <select
                  value={createPriority}
                  onChange={(e) =>
                    setCreatePriority(
                      e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
                    )
                  }
                  className="rounded border px-3 py-2"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Test Steps</h3>
                  <button
                    type="button"
                    onClick={addCreateStep}
                    className="rounded bg-blue-600 px-3 py-2 text-white"
                  >
                    + Add Step
                  </button>
                </div>

                {createSteps.map((step, index) => (
                  <div key={index} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Step {index + 1}</p>

                      {createSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeCreateStep(index)}
                          className="rounded bg-red-600 px-3 py-1 text-white"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    <textarea
                      placeholder="Action"
                      value={step.action}
                      onChange={(e) =>
                        handleCreateStepChange(index, "action", e.target.value)
                      }
                      className="w-full rounded border px-3 py-2"
                      rows={2}
                    />

                    <textarea
                      placeholder="Expected result"
                      value={step.expected}
                      onChange={(e) =>
                        handleCreateStepChange(index, "expected", e.target.value)
                      }
                      className="w-full rounded border px-3 py-2"
                      rows={2}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded border px-4 py-2"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {creating ? "Création..." : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingTestCase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Modifier le test case</h2>
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded border px-3 py-1"
              >
                Fermer
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <input
                type="text"
                placeholder="Titre du test case"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full rounded border px-3 py-2"
              />

              <textarea
                placeholder="Description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full rounded border px-3 py-2"
                rows={3}
              />

              <textarea
                placeholder="Expected global result"
                value={editExpected}
                onChange={(e) => setEditExpected(e.target.value)}
                className="w-full rounded border px-3 py-2"
                rows={2}
              />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <select
                  value={editStatus}
                  onChange={(e) =>
                    setEditStatus(
                      e.target.value as "DRAFT" | "READY" | "DEPRECATED"
                    )
                  }
                  className="rounded border px-3 py-2"
                >
                  <option value="DRAFT">DRAFT</option>
                  <option value="READY">READY</option>
                  <option value="DEPRECATED">DEPRECATED</option>
                </select>

                <select
                  value={editPriority}
                  onChange={(e) =>
                    setEditPriority(
                      e.target.value as "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
                    )
                  }
                  className="rounded border px-3 py-2"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Test Steps</h3>
                  <button
                    type="button"
                    onClick={addEditStep}
                    className="rounded bg-blue-600 px-3 py-2 text-white"
                  >
                    + Add Step
                  </button>
                </div>

                {editSteps.map((step, index) => (
                  <div key={index} className="space-y-3 rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-medium">Step {index + 1}</p>

                      {editSteps.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeEditStep(index)}
                          className="rounded bg-red-600 px-3 py-1 text-white"
                        >
                          Delete
                        </button>
                      )}
                    </div>

                    <textarea
                      placeholder="Action"
                      value={step.action}
                      onChange={(e) =>
                        handleEditStepChange(index, "action", e.target.value)
                      }
                      className="w-full rounded border px-3 py-2"
                      rows={2}
                    />

                    <textarea
                      placeholder="Expected result"
                      value={step.expected}
                      onChange={(e) =>
                        handleEditStepChange(index, "expected", e.target.value)
                      }
                      className="w-full rounded border px-3 py-2"
                      rows={2}
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded border px-4 py-2"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="rounded bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  {updating ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>

    </div>
  );
}