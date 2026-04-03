import { createContext, useContext, useEffect, useState } from "react";

type Project = {
  id: string;
  name: string;
};

type ProjectContextType = {
  selectedProject: Project | null;
  setSelectedProject: (project: Project | null) => void;
};

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [selectedProject, setSelectedProjectState] = useState<Project | null>(null);

  useEffect(() => {
    const savedProject = localStorage.getItem("selected_project");

    if (savedProject) {
      try {
        setSelectedProjectState(JSON.parse(savedProject));
      } catch {
        localStorage.removeItem("selected_project");
      }
    }
  }, []);

  function setSelectedProject(project: Project | null) {
    if (project) {
      localStorage.setItem("selected_project", JSON.stringify(project));
      setSelectedProjectState(project);
    } else {
      localStorage.removeItem("selected_project");
      setSelectedProjectState(null);
    }
  }

  return (
    <ProjectContext.Provider value={{ selectedProject, setSelectedProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);

  if (!context) {
    throw new Error("useProject must be used inside ProjectProvider");
  }

  return context;
}