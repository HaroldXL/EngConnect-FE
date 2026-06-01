import { useState, useEffect, useCallback, useMemo } from "react";
import {
  AddCircle,
  AltArrowDown,
  AltArrowLeft,
  AltArrowRight,
  AltArrowUp,
  BookBookmark,
  CheckCircle,
  CloseSquare,
  Diskette,
  Eye,
  File,
  Gallery,
  HeadphonesRound,
  History,
  MinimalisticMagnifier,
  Pen,
  Restart,
  Plain,
  SquareAltArrowRight,
  TagPrice,
  TrashBinMinimalistic,
  Videocamera,
  VolumeLoud,
} from "@solar-icons/react";
import {
  Input,
  Button,
  Textarea,
  Card,
  CardBody,
  Select,
  SelectItem,
  Divider,
  Alert,
  Chip,
  Checkbox,
  Spinner,
  addToast,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import { motion } from "framer-motion";

import { coursesApi } from "../../../api";
import { selectUser } from "../../../store";

const CDN_BASE = "https://d20854st1o56hw.cloudfront.net/";
// Strip duplicate CDN prefix that can occur when the backend stores a full URL
// but another layer prepends the CDN base again.
const normalizeResourceUrl = (url) => {
  if (!url) return "";
  if (url.startsWith(CDN_BASE + CDN_BASE)) return url.slice(CDN_BASE.length);
  return url;
};

const getSkillStyle = (name = "") => {
  const n = name.toLowerCase();
  if (n.includes("speak"))
    return {
      Icon: VolumeLoud,
      color: "#F97316",
      iconBg: "rgba(249,115,22,0.15)",
    };
  if (n.includes("listen"))
    return {
      Icon: HeadphonesRound,
      color: "#06B6D4",
      iconBg: "rgba(6,182,212,0.15)",
    };
  if (n.includes("read"))
    return {
      Icon: BookBookmark,
      color: "#10B981",
      iconBg: "rgba(16,185,129,0.15)",
    };
  if (n.includes("writ"))
    return {
      Icon: Pen,
      color: "#3B82F6",
      iconBg: "rgba(59,130,246,0.15)",
    };
  return { Icon: TagPrice, color: "#6B7280", iconBg: "rgba(107,114,128,0.15)" };
};

const LEVELS = [
  "Beginner",
  "Elementary",
  "Intermediate",
  "Upper-Intermediate",
  "Advanced",
  "Beginner to Advanced",
];

const CreateCourse = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { courseId: continueId } = useParams();
  const colors = useThemeColors();
  const { inputClassNames, selectClassNames } = useInputStyles();

  // Step state
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(!!continueId);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState({});

  // Created IDs returned from API after each step
  const [createdCourseId, setCreatedCourseId] = useState(null);
  const [createdModules, setCreatedModules] = useState([]);
  const [createdSessions, setCreatedSessions] = useState({});
  const [createdResources, setCreatedResources] = useState({});

  // Step 1: Course info
  const [courseData, setCourseData] = useState({
    Title: "",
    ShortDescription: "",
    FullDescription: "",
    Outcomes: "",
    Level: "",
    EstimatedTimeLesson: "",
    Price: "",
    Currency: "VND",
    NumsSessionInWeek: "",
    IsCertificate: false,
    CategoryIds: [],
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [demoVideoFile, setDemoVideoFile] = useState(null);
  const [existingThumbnailUrl, setExistingThumbnailUrl] = useState(null);
  const [existingDemoVideoUrl, setExistingDemoVideoUrl] = useState(null);
  const [categories, setCategories] = useState([]);
  const skillCategories = useMemo(
    () => categories.filter((c) => c.type === "Skill"),
    [categories],
  );
  const purposeCategories = useMemo(
    () => categories.filter((c) => c.type === "Purpose"),
    [categories],
  );

  // Step 2: Modules
  const [modules, setModules] = useState([
    {
      title: "",
      description: "",
      outcomes: "",
      moduleNumber: 1,
      _key: "new-init",
    },
  ]);
  const [existingModules, setExistingModules] = useState([]);
  const [selectedExistingModules, setSelectedExistingModules] = useState([]);
  const [moduleSearch, setModuleSearch] = useState("");
  const [loadingExistingModules, setLoadingExistingModules] = useState(false);

  // Step 3: Sessions (per module)
  const [sessions, setSessions] = useState({});
  const [existingSessions, setExistingSessions] = useState([]);
  const [selectedExistingSessions, setSelectedExistingSessions] = useState({});
  const [sessionSearch, setSessionSearch] = useState("");
  const [loadingExistingSessions, setLoadingExistingSessions] = useState(false);
  const [activeModuleForSessions, setActiveModuleForSessions] = useState(null);

  // Step 4: Resources (per session)
  const [resources, setResources] = useState({});
  const [existingResources, setExistingResources] = useState([]);
  const [selectedExistingResources, setSelectedExistingResources] = useState(
    {},
  );
  const [resourceSearch, setResourceSearch] = useState("");
  const [loadingExistingResources, setLoadingExistingResources] =
    useState(false);
  const [activeSessionForResources, setActiveSessionForResources] =
    useState(null);

  // Edit mode tracking
  const [deletedModuleIds, setDeletedModuleIds] = useState([]);
  const [deletedSessionIds, setDeletedSessionIds] = useState([]);
  const [deletedResourceIds, setDeletedResourceIds] = useState([]);
  const [thumbnailChanged, setThumbnailChanged] = useState(false);
  const [demoVideoChanged, setDemoVideoChanged] = useState(false);

  // Ordering for create flow
  const [moduleOrder, setModuleOrder] = useState([]);
  const [sessionOrder, setSessionOrder] = useState({});

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Submit for verification confirmation
  const [submitConfirm, setSubmitConfirm] = useState(false);

  // Inline edit mode for existing items
  const [editingModuleIndex, setEditingModuleIndex] = useState(null);
  const [moduleSnapshot, setModuleSnapshot] = useState(null);
  const [editingSessionKey, setEditingSessionKey] = useState(null); // "moduleId-index"
  const [sessionSnapshot, setSessionSnapshot] = useState(null);
  const [savingModule, setSavingModule] = useState(false);
  const [savingSession, setSavingSession] = useState(false);

  // Save new modules/sessions/resources in edit mode
  const [savingNewModules, setSavingNewModules] = useState(false);
  const [savingNewSessions, setSavingNewSessions] = useState(false);
  const [savingNewResources, setSavingNewResources] = useState(false);
  const [deletingModuleId, setDeletingModuleId] = useState(null);
  const [deletingSessionKey, setDeletingSessionKey] = useState(null);
  const [deletingResourceKey, setDeletingResourceKey] = useState(null);

  // Inline edit for created (saved) modules
  const [editingCreatedModuleId, setEditingCreatedModuleId] = useState(null);
  const [createdModuleSnapshot, setCreatedModuleSnapshot] = useState(null);

  // Inline edit for created (saved) sessions
  const [editingCreatedSessionKey, setEditingCreatedSessionKey] =
    useState(null);
  const [createdSessionSnapshot, setCreatedSessionSnapshot] = useState(null);

  // Inline edit for existing resources (step 4)
  const [editingResourceKey, setEditingResourceKey] = useState(null); // "sessionId|index"
  const [resourceSnapshot, setResourceSnapshot] = useState(null);
  const [savingResource, setSavingResource] = useState(false);

  // Version history
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyType, setHistoryType] = useState(""); // "module" | "session"
  const [historyItemName, setHistoryItemName] = useState("");

  // Module detail preview
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Resource detail preview
  const [resourceDetailOpen, setResourceDetailOpen] = useState(false);
  const [resourceDetailData, setResourceDetailData] = useState(null);
  const [resourceDetailLoading, setResourceDetailLoading] = useState(false);

  // Load categories on mount
  useEffect(() => {
    coursesApi
      .getCategories({ "page-size": 50 })
      .then((res) => setCategories(res?.data?.items || []))
      .catch(() => {});
  }, []);

  // Continue creating: load existing course data
  useEffect(() => {
    if (!continueId) return;
    const loadCourse = async () => {
      try {
        setInitialLoading(true);
        const res = await coursesApi.getCourseById(continueId);
        const c = res.data;
        if (!c) return;

        // Ownership check — block editing courses not owned by current tutor
        if (c.tutorId && user?.tutorId && c.tutorId !== user.tutorId) {
          navigate("/tutor/my-courses", { replace: true });
          return;
        }

        // Populate course info
        setCreatedCourseId(c.id);
        setCourseData({
          Title: c.title || "",
          ShortDescription: c.shortDescription || "",
          FullDescription: c.fullDescription || "",
          Outcomes: c.outcomes || "",
          Level: c.level || "",
          EstimatedTimeLesson: c.estimatedTimeLesson
            ? String(
                typeof c.estimatedTimeLesson === "string" &&
                  c.estimatedTimeLesson.includes(":")
                  ? (() => {
                      const parts = c.estimatedTimeLesson.split(":");
                      return parseInt(parts[0]) * 60 + parseInt(parts[1]);
                    })()
                  : parseInt(c.estimatedTimeLesson) || 0,
              )
            : "",
          Price: c.price
            ? c.price.toLocaleString("vi-VN").replace(/,/g, ".")
            : "",
          Currency: c.currency || "VND",
          NumsSessionInWeek: c.numsSessionInWeek
            ? String(c.numsSessionInWeek)
            : "",
          IsCertificate: c.isCertificate || false,
          CategoryIds: (c.courseCategories || []).map(
            (cat) => cat.categoryId || cat.id,
          ),
        });

        // Load existing media URLs
        if (c.thumbnailUrl) setExistingThumbnailUrl(c.thumbnailUrl);
        if (c.demoVideoUrl) setExistingDemoVideoUrl(c.demoVideoUrl);

        // Load modules
        const mods = (c.courseCourseModules || []).sort(
          (a, b) => a.moduleNumber - b.moduleNumber,
        );

        if (mods.length === 0) {
          // No modules → start at step 2
          setStep(2);
          loadExistingModules(c.id);
        } else {
          setCreatedModules(
            mods.map((m) => ({
              id: m.courseModuleId,
              joinId: m.id,
              title: m.moduleTitle || "",
              description: m.moduleDescription || "",
              outcomes: m.moduleOutcomes || "",
              moduleNumber: m.moduleNumber,
              _key: `loaded-${m.courseModuleId}`,
            })),
          );

          // Check sessions
          const allSessions = {};
          let hasSessions = false;
          mods.forEach((m) => {
            const sess = (m.courseModuleCourseSessions || []).sort(
              (a, b) => a.sessionNumber - b.sessionNumber,
            );
            allSessions[m.courseModuleId] = sess.map((s) => ({
              id: s.courseSessionId,
              joinId: s.id,
              title: s.sessionTitle || "",
              description: s.sessionDescription || "",
              outcomes: s.sessionOutcomes || "",
              sessionNumber: s.sessionNumber,
              _key: `loaded-${s.courseSessionId}`,
            }));
            if (sess.length > 0) hasSessions = true;
          });

          if (!hasSessions) {
            // Modules exist but no sessions → start at step 3
            // pricePerLesson stays as entered (0 sessions means can't derive it)
            setCreatedSessions({});
            setSessions(
              Object.fromEntries(
                mods.map((m) => [
                  m.courseModuleId,
                  [
                    {
                      title: "",
                      description: "",
                      outcomes: "",
                      sessionNumber: 1,
                      _key: `new-init-${m.courseModuleId}`,
                    },
                  ],
                ]),
              ),
            );
            setActiveModuleForSessions(mods[0].courseModuleId);
            setStep(3);
            loadExistingSessions(mods[0].courseModuleId);
          } else {
            // Has sessions → load them and start at step 4 (resources)
            setCreatedSessions(allSessions);
            // Derive pricePerLesson from stored total price ÷ session count
            const totalSess = Object.values(allSessions).flat().length;
            if (totalSess > 0 && c.price > 0) {
              const perLesson = Math.round(c.price / totalSess);
              setCourseData((prev) => ({
                ...prev,
                Price: perLesson.toLocaleString("vi-VN").replace(/,/g, "."),
              }));
            }
            const allSess = Object.values(allSessions).flat();
            const resMap = {};
            const createdResMap = {};
            for (const s of allSess) {
              try {
                const rRes = await coursesApi.getAllCourseResources({
                  CourseSessionId: s.id,
                  "page-size": 100,
                });
                if (rRes.isSuccess && rRes.data?.items?.length > 0) {
                  const items = rRes.data.items;
                  resMap[s.id] = items.map((r) => ({
                    id: r.id,
                    title: r.title || "",
                    resourceType: r.resourceType || "",
                    url: r.url || "",
                    file: null,
                  }));
                  createdResMap[s.id] = items;
                } else {
                  resMap[s.id] = [];
                }
              } catch {
                resMap[s.id] = [];
              }
            }
            setResources(resMap);
            if (Object.keys(createdResMap).length > 0) {
              setCreatedResources(createdResMap);
            }
            const firstSession = allSess[0];
            if (firstSession) {
              setActiveSessionForResources(firstSession.id);
              loadExistingResources(firstSession.id);
            }
            setStep(4);
          }
        }
      } catch (err) {
        console.error("Failed to load course for continue:", err);
        setError(t("tutorDashboard.createCourse.error.loadFailed"));
      } finally {
        setInitialLoading(false);
      }
    };
    loadCourse();
  }, [continueId]);

  // Handlers
  const handleCourseChange = (field, value) => {
    setCourseData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field])
      setValidationErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleModuleChange = (index, field, value) => {
    const updated = [...modules];
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
  };

  const addModule = () => {
    setModules((prev) => {
      const createdMax = createdModules.reduce(
        (max, m) => Math.max(max, m.moduleNumber || 0),
        0,
      );
      const newMax = prev.reduce(
        (max, m) => Math.max(max, m.moduleNumber || 0),
        0,
      );
      const maxNum = Math.max(createdMax, newMax);
      return [
        ...prev,
        {
          title: "",
          description: "",
          outcomes: "",
          moduleNumber: maxNum + 1,
          _key: `new-${Date.now()}`,
        },
      ];
    });
  };

  const removeModule = (index) => {
    // Allow removing the last new-module form if the user has reused/existing modules to fall back on
    if (
      modules.length <= 1 &&
      selectedExistingModules.length === 0 &&
      createdModules.length === 0
    )
      return;
    const mod = modules[index];
    if (mod.joinId) {
      setDeletedModuleIds((prev) => [...prev, mod.joinId]);
    }
    const isEditing = createdModules.length > 0;
    setModules((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return isEditing
        ? filtered
        : filtered.map((m, i) => ({ ...m, moduleNumber: i + 1 }));
    });
  };

  const getSessionsForModule = (moduleId) => sessions[moduleId] || [];

  const handleSessionChange = (moduleId, index, field, value) => {
    setSessions((prev) => {
      const arr = [...(prev[moduleId] || [])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [moduleId]: arr };
    });
  };

  const addSession = (moduleId) => {
    setSessions((prev) => {
      const arr = prev[moduleId] || [];
      const maxNum = arr.reduce(
        (max, s) => Math.max(max, s.sessionNumber || 0),
        0,
      );
      return {
        ...prev,
        [moduleId]: [
          ...arr,
          {
            title: "",
            description: "",
            outcomes: "",
            sessionNumber: maxNum + 1,
            _key: `new-${Date.now()}`,
          },
        ],
      };
    });
  };

  const removeSession = (moduleId, index) => {
    const sessArr = sessions[moduleId] || [];
    const sess = sessArr[index];
    if (sess?.joinId) {
      setDeletedSessionIds((prev) => [...prev, sess.joinId]);
    }
    const isEditing = Object.keys(createdSessions).length > 0;
    setSessions((prev) => {
      const arr = (prev[moduleId] || []).filter((_, i) => i !== index);
      return {
        ...prev,
        [moduleId]: isEditing
          ? arr
          : arr.map((s, i) => ({ ...s, sessionNumber: i + 1 })),
      };
    });
  };

  // Refresh created modules from course data (gets join-table IDs)
  const refreshCreatedModules = async () => {
    const courseRes = await coursesApi.getCourseById(createdCourseId);
    const mods = (courseRes.data?.courseCourseModules || []).sort(
      (a, b) => a.moduleNumber - b.moduleNumber,
    );
    const mapped = mods.map((m) => ({
      id: m.courseModuleId,
      joinId: m.id,
      title: m.moduleTitle || "",
      description: m.moduleDescription || "",
      outcomes: m.moduleOutcomes || "",
      moduleNumber: m.moduleNumber,
      _key: `loaded-${m.courseModuleId}`,
    }));
    setCreatedModules(mapped);
    return mapped;
  };

  // Refresh created sessions from course data
  const refreshCreatedSessions = async () => {
    const courseRes = await coursesApi.getCourseById(createdCourseId);
    const mods = courseRes.data?.courseCourseModules || [];
    const allSessions = {};
    mods.forEach((m) => {
      const sess = (m.courseModuleCourseSessions || []).sort(
        (a, b) => a.sessionNumber - b.sessionNumber,
      );
      allSessions[m.courseModuleId] = sess.map((s) => ({
        id: s.courseSessionId,
        joinId: s.id,
        title: s.sessionTitle || "",
        description: s.sessionDescription || "",
        outcomes: s.sessionOutcomes || "",
        sessionNumber: s.sessionNumber,
        _key: `loaded-${s.courseSessionId}`,
      }));
    });
    setCreatedSessions(allSessions);
    return allSessions;
  };

  const refreshCreatedResources = async () => {
    const allSessions = Object.values(createdSessions).flat();
    const resMap = {};
    for (const sess of allSessions) {
      try {
        const rRes = await coursesApi.getAllCourseResources({
          CourseSessionId: sess.id,
          "page-size": 100,
        });
        if (rRes.isSuccess && rRes.data?.items?.length > 0) {
          resMap[sess.id] = rRes.data.items;
        }
      } catch {
        // keep existing
      }
    }
    setCreatedResources(resMap);
    return resMap;
  };

  // Handlers for created (saved) modules
  const handleCreatedModuleChange = (moduleId, field, value) => {
    setCreatedModules((prev) =>
      prev.map((m) => (m.id === moduleId ? { ...m, [field]: value } : m)),
    );
  };

  const startEditCreatedModule = (moduleId) => {
    const mod = createdModules.find((m) => m.id === moduleId);
    setEditingCreatedModuleId(moduleId);
    setCreatedModuleSnapshot(mod ? { ...mod } : null);
  };

  const cancelEditCreatedModule = () => {
    if (createdModuleSnapshot && editingCreatedModuleId) {
      setCreatedModules((prev) =>
        prev.map((m) =>
          m.id === editingCreatedModuleId ? createdModuleSnapshot : m,
        ),
      );
    }
    setEditingCreatedModuleId(null);
    setCreatedModuleSnapshot(null);
  };

  const saveEditCreatedModule = async (moduleId) => {
    const mod = createdModules.find((m) => m.id === moduleId);
    if (!mod) return;
    setSavingModule(true);
    try {
      await coursesApi.updateCourseModule(moduleId, {
        courseId: createdCourseId,
        title: mod.title,
        description: mod.description,
        outcomes: mod.outcomes,
      });
      setEditingCreatedModuleId(null);
      setCreatedModuleSnapshot(null);
      addToast({
        title: t("tutorDashboard.createCourse.moduleSaved"),
        color: "success",
      });
    } catch (err) {
      console.error("Failed to save module:", err);
      addToast({
        title: t("tutorDashboard.createCourse.error.createFailed"),
        color: "danger",
      });
    } finally {
      setSavingModule(false);
    }
  };

  const handleDeleteCreatedModule = async (moduleId) => {
    const mod = createdModules.find((m) => m.id === moduleId);
    if (!mod) return;
    setDeletingModuleId(moduleId);
    try {
      if (mod.joinId) {
        await coursesApi.removeCourseModule(mod.joinId);
      } else {
        await coursesApi.deleteCourseModule(moduleId);
      }
      setCreatedModules((prev) => prev.filter((m) => m.id !== moduleId));
      setCreatedSessions((prev) => {
        const copy = { ...prev };
        delete copy[moduleId];
        return copy;
      });
      addToast({
        title: t("tutorDashboard.createCourse.moduleDeleted"),
        color: "success",
      });
    } catch (err) {
      console.error("Failed to delete module:", err);
      addToast({
        title: t("tutorDashboard.createCourse.error.deleteFailed"),
        color: "danger",
      });
    } finally {
      setDeletingModuleId(null);
    }
  };

  // Handlers for created (saved) sessions
  const handleCreatedSessionChange = (moduleId, sessionId, field, value) => {
    setCreatedSessions((prev) => ({
      ...prev,
      [moduleId]: (prev[moduleId] || []).map((s) =>
        s.id === sessionId ? { ...s, [field]: value } : s,
      ),
    }));
  };

  const startEditCreatedSession = (moduleId, sessionId) => {
    const sess = (createdSessions[moduleId] || []).find(
      (s) => s.id === sessionId,
    );
    setEditingCreatedSessionKey(`${moduleId}-${sessionId}`);
    setCreatedSessionSnapshot(sess ? { ...sess } : null);
  };

  const cancelEditCreatedSession = () => {
    if (createdSessionSnapshot && editingCreatedSessionKey) {
      const [moduleId, sessionId] = editingCreatedSessionKey.split("-");
      setCreatedSessions((prev) => ({
        ...prev,
        [moduleId]: (prev[moduleId] || []).map((s) =>
          s.id === sessionId ? createdSessionSnapshot : s,
        ),
      }));
    }
    setEditingCreatedSessionKey(null);
    setCreatedSessionSnapshot(null);
  };

  const saveEditCreatedSession = async (moduleId, sessionId) => {
    const sess = (createdSessions[moduleId] || []).find(
      (s) => s.id === sessionId,
    );
    if (!sess) return;
    setSavingSession(true);
    try {
      await coursesApi.updateCourseSession(sessionId, {
        courseModuleId: moduleId,
        title: sess.title,
        description: sess.description,
        outcomes: sess.outcomes,
      });
      setEditingCreatedSessionKey(null);
      setCreatedSessionSnapshot(null);
      addToast({
        title: t("tutorDashboard.createCourse.sessionSaved"),
        color: "success",
      });
    } catch (err) {
      console.error("Failed to save session:", err);
      addToast({
        title: t("tutorDashboard.createCourse.error.createFailed"),
        color: "danger",
      });
    } finally {
      setSavingSession(false);
    }
  };

  // Inline edit handlers for existing resources
  const startEditResource = (sessionId, index) => {
    const resArr = resources[sessionId] || [];
    setEditingResourceKey(`${sessionId}|${index}`);
    setResourceSnapshot({ ...resArr[index] });
  };

  const cancelEditResource = () => {
    if (resourceSnapshot && editingResourceKey) {
      const lastPipe = editingResourceKey.lastIndexOf("|");
      const sessionId = editingResourceKey.slice(0, lastPipe);
      const index = Number.parseInt(editingResourceKey.slice(lastPipe + 1), 10);
      setResources((prev) => {
        const arr = [...(prev[sessionId] || [])];
        arr[index] = resourceSnapshot;
        return { ...prev, [sessionId]: arr };
      });
    }
    setEditingResourceKey(null);
    setResourceSnapshot(null);
  };

  const saveEditResource = async (sessionId, index) => {
    const res = (resources[sessionId] || [])[index];
    if (!res?.id) return;
    setSavingResource(true);
    try {
      await coursesApi.updateCourseResource(res.id, {
        title: res.title,
        resourceType: res.resourceType,
      });
      setEditingResourceKey(null);
      setResourceSnapshot(null);
      addToast({
        title: t("tutorDashboard.createCourse.resourceSaved"),
        color: "success",
      });
    } catch (err) {
      console.error("Failed to save resource:", err);
      addToast({
        title: t("tutorDashboard.createCourse.error.createFailed"),
        color: "danger",
      });
    } finally {
      setSavingResource(false);
    }
  };

  const handleDeleteCreatedSession = async (moduleId, sessionId) => {
    const sess = (createdSessions[moduleId] || []).find(
      (s) => s.id === sessionId,
    );
    if (!sess) return;
    setDeletingSessionKey(`${moduleId}-${sessionId}`);
    try {
      if (sess.joinId) {
        await coursesApi.removeModuleSession(sess.joinId);
      }
      setCreatedSessions((prev) => ({
        ...prev,
        [moduleId]: (prev[moduleId] || []).filter((s) => s.id !== sessionId),
      }));
      addToast({
        title: t("tutorDashboard.createCourse.sessionDeleted"),
        color: "success",
      });
    } catch (err) {
      console.error("Failed to delete session:", err);
      addToast({
        title: t("tutorDashboard.createCourse.error.deleteFailed"),
        color: "danger",
      });
    } finally {
      setDeletingSessionKey(null);
    }
  };

  // Remove an existing resource from a session via DELETE /sessions-resources/{id}
  const handleDeleteSessionResource = async (
    sessionId,
    resourceId,
    resourceIdx,
  ) => {
    if (!resourceId) return;
    setDeletingResourceKey(`${sessionId}|${resourceIdx}`);
    try {
      await coursesApi.removeSessionResource(sessionId, resourceId);
      setResources((prev) => {
        const arr = (prev[sessionId] || []).filter((_, i) => i !== resourceIdx);
        return { ...prev, [sessionId]: arr };
      });
      setCreatedResources((prev) => {
        const arr = (prev[sessionId] || []).filter((r) => r.id !== resourceId);
        return { ...prev, [sessionId]: arr };
      });
      addToast({
        title: t("tutorDashboard.createCourse.resourceDeleted"),
        color: "success",
      });
    } catch (err) {
      console.error("Failed to delete session resource:", err);
      addToast({
        title: t("tutorDashboard.createCourse.error.deleteFailed"),
        color: "danger",
      });
    } finally {
      setDeletingResourceKey(null);
    }
  };

  // Save only NEW modules (edit mode)
  const handleSaveNewModules = async () => {
    for (const mod of modules) {
      if (!mod.title.trim()) {
        setError(
          t("tutorDashboard.createCourse.validation.modulesTitleRequired"),
        );
        return;
      }
    }
    if (modules.length === 0 && selectedExistingModules.length === 0) return;
    setSavingNewModules(true);
    setError("");
    try {
      const maxModNum = createdModules.reduce(
        (max, m) => Math.max(max, m.moduleNumber || 0),
        0,
      );
      const newModsPayload = [];
      const existingIdsPayload = [];
      moduleOrder.forEach((item, idx) => {
        const num = maxModNum + idx + 1;
        if (item.type === "new") {
          const mod = modules.find((m) => m._key === item._key);
          if (mod?.title.trim()) {
            newModsPayload.push({
              title: mod.title,
              description: mod.description,
              outcomes: mod.outcomes,
              moduleNumber: num,
            });
          }
        } else {
          existingIdsPayload.push({
            courseModuleId: item.existingId,
            moduleNumber: num,
          });
        }
      });
      // Fallback for modules not in order
      const orderedKeys = new Set(
        moduleOrder.filter((i) => i.type === "new").map((i) => i._key),
      );
      modules.forEach((m) => {
        if (m.title.trim() && !orderedKeys.has(m._key)) {
          newModsPayload.push({
            title: m.title,
            description: m.description,
            outcomes: m.outcomes,
            moduleNumber:
              maxModNum + newModsPayload.length + existingIdsPayload.length + 1,
          });
        }
      });
      if (newModsPayload.length === 0 && existingIdsPayload.length === 0)
        return;
      const payload = {
        courseId: createdCourseId,
        newCourseModules: newModsPayload,
        courseModuleIdExists: existingIdsPayload,
      };
      await coursesApi.createCourseModule(payload);
      // Refresh to get join-table IDs
      await refreshCreatedModules();
      setModules([]);
      setSelectedExistingModules([]);
      setModuleOrder([]);
      addToast({
        title: t("tutorDashboard.createCourse.moduleSaved"),
        color: "success",
      });
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          t("tutorDashboard.createCourse.error.createFailed"),
      );
    } finally {
      setSavingNewModules(false);
    }
  };

  // Save only NEW sessions (edit mode)
  const handleSaveNewSessions = async () => {
    if (!activeModuleForSessions) return;
    const modId = activeModuleForSessions;
    const modSessions = sessions[modId] || [];
    const selectedForModule = selectedExistingSessions[modId] || [];
    if (modSessions.length === 0 && selectedForModule.length === 0) return;

    for (const sess of modSessions) {
      if (!sess.title.trim()) {
        setError(
          t("tutorDashboard.createCourse.validation.sessionsTitleRequired"),
        );
        return;
      }
    }

    setSavingNewSessions(true);
    setError("");
    try {
      const existingSess = createdSessions[modId] || [];
      const maxSessNum = existingSess.reduce(
        (max, s) => Math.max(max, s.sessionNumber || 0),
        0,
      );
      const modSessionOrder = sessionOrder[modId] || [];
      const newSessionsPayload = [];
      const existingSessionsPayload = [];

      if (modSessionOrder.length > 0) {
        modSessionOrder.forEach((item, idx) => {
          const num = maxSessNum + idx + 1;
          if (item.type === "new") {
            const sess = modSessions.find((s) => s._key === item._key);
            if (sess?.title.trim()) {
              newSessionsPayload.push({
                title: sess.title,
                description: sess.description,
                outcomes: sess.outcomes,
                sessionNumber: num,
              });
            }
          } else {
            existingSessionsPayload.push({
              courseSessionId: item.existingId,
              sessionNumber: num,
            });
          }
        });
        const orderedKeys = new Set(
          modSessionOrder.filter((i) => i.type === "new").map((i) => i._key),
        );
        modSessions.forEach((s) => {
          if (s.title.trim() && !orderedKeys.has(s._key)) {
            newSessionsPayload.push({
              title: s.title,
              description: s.description,
              outcomes: s.outcomes,
              sessionNumber:
                maxSessNum +
                newSessionsPayload.length +
                existingSessionsPayload.length +
                1,
            });
          }
        });
      } else {
        modSessions.forEach((s, idx) => {
          if (s.title.trim()) {
            newSessionsPayload.push({
              title: s.title,
              description: s.description,
              outcomes: s.outcomes,
              sessionNumber: maxSessNum + idx + 1,
            });
          }
        });
        selectedForModule.forEach((id, idx) => {
          existingSessionsPayload.push({
            courseSessionId: id,
            sessionNumber: maxSessNum + modSessions.length + idx + 1,
          });
        });
      }

      if (
        newSessionsPayload.length === 0 &&
        existingSessionsPayload.length === 0
      )
        return;

      const payload = {
        courseModuleId: modId,
        newCourseSessions: newSessionsPayload,
        courseSessionIdExists: existingSessionsPayload,
      };
      await coursesApi.createCourseSession(payload);
      // Refresh to get join-table IDs
      await refreshCreatedSessions();
      setSessions((prev) => ({ ...prev, [modId]: [] }));
      setSelectedExistingSessions((prev) => ({ ...prev, [modId]: [] }));
      setSessionOrder((prev) => ({ ...prev, [modId]: [] }));
      addToast({
        title: t("tutorDashboard.createCourse.sessionSaved"),
        color: "success",
      });
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          t("tutorDashboard.createCourse.error.createFailed"),
      );
    } finally {
      setSavingNewSessions(false);
    }
  };

  // Save only NEW resources for the active session (edit mode)
  const handleSaveNewResources = async () => {
    const sessId = activeSessionForResources;
    if (!sessId) return;
    const newResources = (resources[sessId] || []).filter(
      (r) => !r.id && r.title.trim(),
    );
    const selectedIds = selectedExistingResources[sessId] || [];
    if (newResources.length === 0 && selectedIds.length === 0) return;
    setSavingNewResources(true);
    setError("");
    try {
      for (const r of newResources) {
        const payload = {
          CourseSessionId: sessId,
          Title: r.title,
          ResourceType: r.resourceType,
        };
        if (r.file) {
          payload.ResourceFile = r.file;
          payload.ResourceFileName = r.file.name;
        }
        await coursesApi.createCourseResource(payload);
      }
      if (selectedIds.length > 0) {
        await coursesApi.addSessionResource({
          courseSessionId: sessId,
          courseResources: selectedIds.map((id) => ({ courseResourceId: id })),
        });
      }
      // Reload from server to get fresh IDs/URLs
      const refreshed = await refreshCreatedResources();
      // Rebuild resources UI state from fresh server data
      const resMap = {};
      Object.entries(refreshed).forEach(([sId, resArr]) => {
        resMap[sId] = resArr.map((r) => ({
          id: r.id,
          title: r.title || "",
          resourceType: r.resourceType || "",
          url: r.url || "",
          file: null,
        }));
      });
      setResources(resMap);
      setSelectedExistingResources((prev) => ({ ...prev, [sessId]: [] }));
      addToast({
        title: t("tutorDashboard.createCourse.resourceSaved"),
        color: "success",
      });
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          t("tutorDashboard.createCourse.error.createFailed"),
      );
    } finally {
      setSavingNewResources(false);
    }
  };

  // Inline edit handlers for existing modules
  const startEditModule = (index) => {
    setEditingModuleIndex(index);
    setModuleSnapshot({ ...modules[index] });
  };

  const cancelEditModule = () => {
    if (moduleSnapshot && editingModuleIndex !== null) {
      const updated = [...modules];
      updated[editingModuleIndex] = moduleSnapshot;
      setModules(updated);
    }
    setEditingModuleIndex(null);
    setModuleSnapshot(null);
  };

  const saveEditModule = async (index) => {
    const mod = modules[index];
    if (!mod.id) return;
    setSavingModule(true);
    try {
      await coursesApi.updateCourseModule(mod.id, {
        courseId: createdCourseId,
        title: mod.title,
        description: mod.description,
        outcomes: mod.outcomes,
      });
      // Update createdModules to reflect saved data
      setCreatedModules((prev) =>
        prev.map((m) =>
          m.id === mod.id
            ? {
                ...m,
                title: mod.title,
                description: mod.description,
                outcomes: mod.outcomes,
              }
            : m,
        ),
      );
      setEditingModuleIndex(null);
      setModuleSnapshot(null);
      addToast({
        title: t("tutorDashboard.createCourse.moduleSaved"),
        color: "success",
      });
    } catch (err) {
      console.error("Failed to save module:", err);
      addToast({
        title: t("tutorDashboard.createCourse.error.createFailed"),
        color: "danger",
      });
    } finally {
      setSavingModule(false);
    }
  };

  // Inline edit handlers for existing sessions
  const startEditSession = (moduleId, index) => {
    const sessArr = sessions[moduleId] || [];
    setEditingSessionKey(`${moduleId}-${index}`);
    setSessionSnapshot({ ...sessArr[index] });
  };

  const cancelEditSession = () => {
    if (sessionSnapshot && editingSessionKey) {
      const [moduleId, indexStr] = editingSessionKey.split("-");
      const index = Number.parseInt(indexStr, 10);
      setSessions((prev) => {
        const arr = [...(prev[moduleId] || [])];
        arr[index] = sessionSnapshot;
        return { ...prev, [moduleId]: arr };
      });
    }
    setEditingSessionKey(null);
    setSessionSnapshot(null);
  };

  const saveEditSession = async (moduleId, index) => {
    const sess = (sessions[moduleId] || [])[index];
    if (!sess?.id) return;
    setSavingSession(true);
    try {
      await coursesApi.updateCourseSession(sess.id, {
        courseModuleId: moduleId,
        title: sess.title,
        description: sess.description,
        outcomes: sess.outcomes,
      });
      // Update createdSessions to reflect saved data
      setCreatedSessions((prev) => ({
        ...prev,
        [moduleId]: (prev[moduleId] || []).map((s) =>
          s.id === sess.id
            ? {
                ...s,
                title: sess.title,
                description: sess.description,
                outcomes: sess.outcomes,
              }
            : s,
        ),
      }));
      setEditingSessionKey(null);
      setSessionSnapshot(null);
      addToast({
        title: t("tutorDashboard.createCourse.sessionSaved"),
        color: "success",
      });
    } catch (err) {
      console.error("Failed to save session:", err);
      addToast({
        title: t("tutorDashboard.createCourse.error.createFailed"),
        color: "danger",
      });
    } finally {
      setSavingSession(false);
    }
  };

  const getResourcesForSession = (sessionId) => resources[sessionId] || [];

  const handleResourceChange = (sessionId, index, field, value) => {
    setResources((prev) => {
      const arr = [...(prev[sessionId] || [])];
      arr[index] = { ...arr[index], [field]: value };
      return { ...prev, [sessionId]: arr };
    });
  };

  const addResource = (sessionId) => {
    setResources((prev) => {
      const arr = prev[sessionId] || [];
      return {
        ...prev,
        [sessionId]: [...arr, { title: "", resourceType: "", file: null }],
      };
    });
  };

  const removeResource = (sessionId, index) => {
    setResources((prev) => {
      const arr = (prev[sessionId] || []).filter((_, i) => i !== index);
      return { ...prev, [sessionId]: arr };
    });
  };

  // View module detail
  const handleViewModuleDetail = async (moduleId) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailData(null);
    try {
      const res = await coursesApi.getCourseModuleById(moduleId);
      if (res?.isSuccess) {
        setDetailData(res.data);
      }
    } catch (err) {
      console.error("Failed to load module detail:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  // View resource detail
  const handleViewResourceDetail = async (resourceId) => {
    setResourceDetailOpen(true);
    setResourceDetailLoading(true);
    setResourceDetailData(null);
    try {
      const res = await coursesApi.getCourseResourceById(resourceId);
      if (res?.isSuccess) {
        setResourceDetailData(res.data);
      }
    } catch (err) {
      console.error("Failed to load resource detail:", err);
    } finally {
      setResourceDetailLoading(false);
    }
  };

  // Load existing items
  const loadExistingModules = async (courseId) => {
    setLoadingExistingModules(true);
    try {
      const res = await coursesApi.getCourseModulesByTutor({
        ...(courseId ? { CourseId: courseId } : {}),
        "page-size": 50,
      });
      setExistingModules(res?.data?.items || []);
    } catch {
      /* ignore */
    } finally {
      setLoadingExistingModules(false);
    }
  };

  const loadExistingSessions = async (moduleId) => {
    if (!moduleId) return;
    setLoadingExistingSessions(true);
    try {
      const res = await coursesApi.getCourseSessionsByTutor({
        CourseModuleId: moduleId,
        "page-size": 50,
      });
      setExistingSessions(res?.data?.items || []);
    } catch {
      /* ignore */
    } finally {
      setLoadingExistingSessions(false);
    }
  };

  const loadExistingResources = async (sessionId) => {
    if (!sessionId) return;
    setLoadingExistingResources(true);
    try {
      const res = await coursesApi.getCourseResourcesByTutor({
        CourseSessionId: sessionId,
        "page-size": 50,
      });
      setExistingResources(res?.data?.items || []);
    } catch {
      setExistingResources([]);
    } finally {
      setLoadingExistingResources(false);
    }
  };

  // Version history
  const loadModuleHistory = async (courseModuleId, title) => {
    setHistoryType("module");
    setHistoryItemName(title || "");
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryData(null);
    try {
      const res = await coursesApi.getCourseModuleTree(courseModuleId);
      setHistoryData(res.data || res);
    } catch {
      setHistoryData(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadSessionHistory = async (courseSessionId, title) => {
    setHistoryType("session");
    setHistoryItemName(title || "");
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistoryData(null);
    try {
      const res = await coursesApi.getCourseSessionTree(courseSessionId);
      setHistoryData(res.data || res);
    } catch {
      setHistoryData(null);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleRevertModule = useCallback(
    (version) => {
      if (!version) return;
      setModules((prev) =>
        prev.map((m) =>
          m.id === version.id
            ? {
                ...m,
                title: version.title || "",
                description: version.description || "",
                outcomes: version.outcomes || "",
              }
            : m,
        ),
      );
      setHistoryOpen(false);
      addToast({
        title: t("tutorDashboard.createCourse.versionHistory.revertApplied"),
        color: "success",
        timeout: 3000,
      });
    },
    [t],
  );

  const handleRevertSession = useCallback(
    (moduleId, version) => {
      if (!version) return;
      setSessions((prev) => {
        const arr = (prev[moduleId] || []).map((s) =>
          s.id === version.id
            ? {
                ...s,
                title: version.title || "",
                description: version.description || "",
                outcomes: version.outcomes || "",
              }
            : s,
        );
        return { ...prev, [moduleId]: arr };
      });
      setHistoryOpen(false);
      addToast({
        title: t("tutorDashboard.createCourse.versionHistory.revertApplied"),
        color: "success",
        timeout: 3000,
      });
    },
    [t],
  );

  // Order sync: rebuild module order when modules or selected existing modules change
  useEffect(() => {
    setModuleOrder((prev) => {
      const newItems = modules.map((m) => ({ type: "new", _key: m._key }));
      const existItems = selectedExistingModules.map((id) => ({
        type: "existing",
        existingId: id,
      }));
      const allKeySet = new Set([
        ...newItems.map((n) => `new:${n._key}`),
        ...existItems.map((e) => `ex:${e.existingId}`),
      ]);
      const kept = prev.filter((p) => {
        const key = p.type === "new" ? `new:${p._key}` : `ex:${p.existingId}`;
        return allKeySet.has(key);
      });
      const keptSet = new Set(
        kept.map((p) =>
          p.type === "new" ? `new:${p._key}` : `ex:${p.existingId}`,
        ),
      );
      const added = [
        ...newItems.filter((n) => !keptSet.has(`new:${n._key}`)),
        ...existItems.filter((e) => !keptSet.has(`ex:${e.existingId}`)),
      ];
      const result = [...kept, ...added];
      if (
        result.length === prev.length &&
        result.every((r, i) => {
          const p = prev[i];
          if (!p || r.type !== p.type) return false;
          return r.type === "new"
            ? r._key === p._key
            : r.existingId === p.existingId;
        })
      )
        return prev;
      return result;
    });
  }, [modules, selectedExistingModules]);

  // Order sync: rebuild session order for active module
  useEffect(() => {
    if (!activeModuleForSessions) return;
    const modId = activeModuleForSessions;
    const modSessions = sessions[modId] || [];
    const selectedForModule = selectedExistingSessions[modId] || [];

    setSessionOrder((prev) => {
      const prevForModule = prev[modId] || [];
      const newItems = modSessions.map((s) => ({ type: "new", _key: s._key }));
      const existItems = selectedForModule.map((id) => ({
        type: "existing",
        existingId: id,
      }));
      const allKeySet = new Set([
        ...newItems.map((n) => `new:${n._key}`),
        ...existItems.map((e) => `ex:${e.existingId}`),
      ]);
      const kept = prevForModule.filter((p) => {
        const key = p.type === "new" ? `new:${p._key}` : `ex:${p.existingId}`;
        return allKeySet.has(key);
      });
      const keptSet = new Set(
        kept.map((p) =>
          p.type === "new" ? `new:${p._key}` : `ex:${p.existingId}`,
        ),
      );
      const added = [
        ...newItems.filter((n) => !keptSet.has(`new:${n._key}`)),
        ...existItems.filter((e) => !keptSet.has(`ex:${e.existingId}`)),
      ];
      const result = [...kept, ...added];
      if (
        result.length === prevForModule.length &&
        result.every((r, i) => {
          const p = prevForModule[i];
          if (!p || r.type !== p.type) return false;
          return r.type === "new"
            ? r._key === p._key
            : r.existingId === p.existingId;
        })
      )
        return prev;
      return { ...prev, [modId]: result };
    });
  }, [sessions, selectedExistingSessions, activeModuleForSessions]);

  const moveModuleOrder = (index, direction) => {
    setModuleOrder((prev) => {
      const arr = [...prev];
      const targetIdx = index + direction;
      if (targetIdx < 0 || targetIdx >= arr.length) return prev;
      [arr[index], arr[targetIdx]] = [arr[targetIdx], arr[index]];
      return arr;
    });
  };

  const moveSessionOrder = (moduleId, index, direction) => {
    setSessionOrder((prev) => {
      const arr = [...(prev[moduleId] || [])];
      const targetIdx = index + direction;
      if (targetIdx < 0 || targetIdx >= arr.length) return prev;
      [arr[index], arr[targetIdx]] = [arr[targetIdx], arr[index]];
      return { ...prev, [moduleId]: arr };
    });
  };

  const getModuleOrderInfo = (item) => {
    if (item.type === "new") {
      const idx = modules.findIndex((m) => m._key === item._key);
      const mod = idx >= 0 ? modules[idx] : null;
      return {
        title: mod?.title || t("tutorDashboard.createCourse.untitledModule"),
        desc: mod?.description || "",
        tag: t("tutorDashboard.createCourse.newTag"),
      };
    }
    const existMod = existingModules.find((m) => m.id === item.existingId);
    return {
      title: existMod?.title || item.existingId,
      desc: existMod?.description || "",
      tag: t("tutorDashboard.createCourse.reused"),
    };
  };

  const getSessionOrderInfo = (moduleId, item) => {
    if (item.type === "new") {
      const modSessions = sessions[moduleId] || [];
      const sess = modSessions.find((s) => s._key === item._key);
      return {
        title: sess?.title || t("tutorDashboard.createCourse.untitledSession"),
        desc: sess?.description || "",
        tag: t("tutorDashboard.createCourse.newTag"),
      };
    }
    const existSess = existingSessions.find((s) => s.id === item.existingId);
    return {
      title: existSess?.title || item.existingId,
      desc: existSess?.description || "",
      tag: t("tutorDashboard.createCourse.reused"),
    };
  };

  // Navigate back and populate form from created data
  const goBackToStep = (targetStep) => {
    if (targetStep === 1 && createdModules.length > 0) {
      // Going back to step 1 in edit mode — always reset new modules state
      // (covers the case where goBackToStep(2) was never called, e.g. stepper
      // jump from step 3/4 directly to step 1)
      setModules([]);
      setSelectedExistingModules([]);
      setDeletedModuleIds([]);
      setModuleOrder([]);
      setEditingCreatedModuleId(null);
      setCreatedModuleSnapshot(null);
    }
    if (targetStep === 2 && createdModules.length > 0) {
      // Edit mode: keep createdModules as-is. Reset new modules.
      setModules([]);
      setSelectedExistingModules([]);
      setDeletedModuleIds([]);
      setModuleOrder([]);
      setEditingCreatedModuleId(null);
      setCreatedModuleSnapshot(null);
      loadExistingModules(createdCourseId);
    }
    if (targetStep === 3 && Object.keys(createdSessions).length > 0) {
      // Edit mode: keep createdSessions as-is. Reset new sessions.
      setSessions(Object.fromEntries(createdModules.map((m) => [m.id, []])));
      setSelectedExistingSessions({});
      setDeletedSessionIds([]);
      setSessionOrder({});
      setEditingCreatedSessionKey(null);
      setCreatedSessionSnapshot(null);
      if (createdModules.length > 0) {
        setActiveModuleForSessions(createdModules[0].id);
        loadExistingSessions(createdModules[0].id);
      }
    }
    if (targetStep === 4 && Object.keys(createdResources).length > 0) {
      const resMap = {};
      Object.entries(createdResources).forEach(([sessId, resArr]) => {
        resMap[sessId] = resArr.map((r) => ({
          id: r.id,
          title: r.title || "",
          resourceType: r.resourceType || "",
          url: r.url || "",
          file: null,
        }));
      });
      setResources(resMap);
      setDeletedResourceIds([]);
      const firstSession = Object.values(createdSessions).flat()[0];
      if (firstSession) {
        setActiveSessionForResources(firstSession.id);
        loadExistingResources(firstSession.id);
      }
    }
    setStep(targetStep);
  };

  // Validation
  const validateStep1 = () => {
    const errors = {};
    if (!courseData.Title.trim())
      errors.Title = t("tutorDashboard.createCourse.validation.titleRequired");
    if (!courseData.ShortDescription.trim())
      errors.ShortDescription = t(
        "tutorDashboard.createCourse.validation.shortDescRequired",
      );
    if (!courseData.Level)
      errors.Level = t("tutorDashboard.createCourse.validation.levelRequired");
    if (!courseData.Price || Number(courseData.Price.replace(/\./g, "")) < 0)
      errors.Price = t("tutorDashboard.createCourse.validation.priceRequired");
    if (
      !courseData.NumsSessionInWeek ||
      Number(courseData.NumsSessionInWeek) <= 0
    )
      errors.NumsSessionInWeek = t(
        "tutorDashboard.createCourse.validation.numsSessionRequired",
      );
    if (
      !courseData.EstimatedTimeLesson ||
      Number(courseData.EstimatedTimeLesson) <= 0
    )
      errors.EstimatedTimeLesson = t(
        "tutorDashboard.createCourse.validation.estimatedTimeRequired",
      );
    if (courseData.CategoryIds.length === 0)
      errors.CategoryIds = t(
        "tutorDashboard.createCourse.validation.categoryRequired",
      );
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateStep2 = () => {
    for (const mod of modules) {
      if (!mod.title.trim()) {
        setError(
          t("tutorDashboard.createCourse.validation.modulesTitleRequired"),
        );
        return false;
      }
    }
    return true;
  };

  // Step 1: Create or update course
  const handleCreateCourse = async () => {
    if (!validateStep1()) {
      addToast({
        title: t("tutorDashboard.createCourse.validation.incompleteForm"),
        description: t(
          "tutorDashboard.createCourse.validation.incompleteFormDescription",
        ),
        color: "warning",
        timeout: 3000,
      });
      return;
    }
    setLoading(true);
    setError("");
    try {
      const isEditing = !!createdCourseId;

      if (isEditing) {
        // UPDATE mode
        const pricePerLessonNum =
          Number(courseData.Price.replace(/\./g, "")) || 0;
        const currentSessionCount =
          Object.values(createdSessions).flat().length;
        const payload = {
          title: courseData.Title,
          shortDescription: courseData.ShortDescription,
          fullDescription: courseData.FullDescription,
          outcomes: courseData.Outcomes,
          level: courseData.Level,
          estimatedTimeLesson: Number(courseData.EstimatedTimeLesson) || 0,
          price: pricePerLessonNum * Math.max(currentSessionCount, 1),
          currency: courseData.Currency,
          numsSessionInWeek: Number(courseData.NumsSessionInWeek) || 0,
          isCertificate: courseData.IsCertificate,
          categoryIds: courseData.CategoryIds,
        };
        const res = await coursesApi.updateCourse(createdCourseId, payload);
        if (!res.isSuccess) {
          setError(
            res.error?.message ||
              t("tutorDashboard.createCourse.error.createFailed"),
          );
          return;
        }
        if (thumbnailFile && thumbnailChanged) {
          await coursesApi.updateCourseThumbnail(
            createdCourseId,
            thumbnailFile,
            thumbnailFile.name,
          );
        }
        if (demoVideoFile && demoVideoChanged) {
          await coursesApi.updateCourseDemoVideo(
            createdCourseId,
            demoVideoFile,
            demoVideoFile.name,
          );
        }
        setThumbnailChanged(false);
        setDemoVideoChanged(false);
        setStep(2);
        loadExistingModules(createdCourseId);
      } else {
        // CREATE mode — price is 0 until sessions are created in Step 3
        const payload = {
          Title: courseData.Title,
          ShortDescription: courseData.ShortDescription,
          FullDescription: courseData.FullDescription,
          Outcomes: courseData.Outcomes,
          Level: courseData.Level,
          EstimatedTimeLesson: Number(courseData.EstimatedTimeLesson) || 0,
          Price: 0,
          Currency: courseData.Currency,
          NumsSessionInWeek: Number(courseData.NumsSessionInWeek) || 0,
          IsCertificate: courseData.IsCertificate,
          CategoryIds: courseData.CategoryIds,
        };
        if (thumbnailFile) {
          payload.ThumbnailFile = thumbnailFile;
          payload.ThumbnailFileName = thumbnailFile.name;
        }
        if (demoVideoFile) {
          payload.DemoVideoFile = demoVideoFile;
          payload.DemoVideoFileName = demoVideoFile.name;
        }
        const res = await coursesApi.createCourse(payload);
        if (!res.isSuccess) {
          setError(
            res.error?.message ||
              t("tutorDashboard.createCourse.error.createFailed"),
          );
          return;
        }
        setCreatedCourseId(res.data.id);
        setStep(2);
        loadExistingModules(res.data.id);
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          t("tutorDashboard.createCourse.error.createFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Create or update modules
  const handleCreateModules = async () => {
    // Edit mode — just navigate to step 3
    if (createdModules.length > 0) {
      if (createdModules.length > 0) {
        setActiveModuleForSessions(createdModules[0].id);
        loadExistingSessions(createdModules[0].id);
      }
      setStep(3);
      return;
    }
    // Create mode
    if (!validateStep2()) return;
    setLoading(true);
    setError("");
    try {
      // CREATE mode — use moduleOrder for proper numbering
      const newModulesPayload = [];
      const existingModulesPayload = [];
      moduleOrder.forEach((item, idx) => {
        const num = idx + 1;
        if (item.type === "new") {
          const mod = modules.find((m) => m._key === item._key);
          if (mod?.title.trim()) {
            newModulesPayload.push({
              title: mod.title,
              description: mod.description,
              outcomes: mod.outcomes,
              moduleNumber: num,
            });
          }
        } else {
          existingModulesPayload.push({
            courseModuleId: item.existingId,
            moduleNumber: num,
          });
        }
      });
      // Fallback: modules not in order (e.g. order not populated yet)
      const orderedNewKeys = new Set(
        moduleOrder.filter((i) => i.type === "new").map((i) => i._key),
      );
      modules.forEach((m) => {
        if (m.title.trim() && !orderedNewKeys.has(m._key)) {
          newModulesPayload.push({
            title: m.title,
            description: m.description,
            outcomes: m.outcomes,
            moduleNumber:
              newModulesPayload.length + existingModulesPayload.length + 1,
          });
        }
      });
      const payload = {
        courseId: createdCourseId,
        newCourseModules: newModulesPayload,
        courseModuleIdExists: existingModulesPayload,
      };
      const res = await coursesApi.createCourseModule(payload);
      if (!res.isSuccess) {
        setError(
          res.error?.message ||
            t("tutorDashboard.createCourse.error.createFailed"),
        );
        return;
      }
      // Refresh to get join-table IDs
      const mapped = await refreshCreatedModules();
      // Also refresh sessions — reused modules may already have sessions
      const sessionsData = await refreshCreatedSessions();
      const sessMap = {};
      mapped.forEach((m) => {
        if (!sessionsData[m.id] || sessionsData[m.id].length === 0) {
          sessMap[m.id] = [];
        }
      });
      setSessions((prev) => ({ ...sessMap, ...prev }));
      if (mapped.length > 0) {
        setActiveModuleForSessions(mapped[0].id);
      }
      setStep(3);
      loadExistingSessions(mapped[0]?.id);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          t("tutorDashboard.createCourse.error.createFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Create or update sessions for each module
  const handleCreateSessions = async () => {
    // Edit mode — just navigate to step 4
    if (Object.keys(createdSessions).length > 0) {
      setLoading(true);
      try {
        const allSess = Object.values(createdSessions).flat();
        const resMap = {};
        const createdResMap = {};
        for (const s of allSess) {
          const existing = resources[s.id] || createdResources[s.id];
          if (existing && existing.length > 0) {
            resMap[s.id] = existing;
          } else {
            try {
              const rRes = await coursesApi.getAllCourseResources({
                CourseSessionId: s.id,
                "page-size": 100,
              });
              if (rRes.isSuccess && rRes.data?.items?.length > 0) {
                const items = rRes.data.items;
                resMap[s.id] = items.map((r) => ({
                  id: r.id,
                  title: r.title || "",
                  resourceType: r.resourceType || "",
                  url: r.url || "",
                  file: null,
                }));
                createdResMap[s.id] = items;
              } else {
                resMap[s.id] = [];
              }
            } catch {
              resMap[s.id] = [];
            }
          }
        }
        setResources(resMap);
        if (Object.keys(createdResMap).length > 0) {
          setCreatedResources((prev) => ({ ...prev, ...createdResMap }));
        }
        const firstSession = allSess[0];
        if (firstSession) {
          setActiveSessionForResources(firstSession.id);
          loadExistingResources(firstSession.id);
        }

        // Update total price = pricePerLesson × session count
        const pricePerLessonNum =
          Number(courseData.Price.replace(/\./g, "")) || 0;
        if (pricePerLessonNum > 0 && allSess.length > 0 && createdCourseId) {
          try {
            await coursesApi.updateCourse(createdCourseId, {
              title: courseData.Title,
              shortDescription: courseData.ShortDescription,
              fullDescription: courseData.FullDescription,
              outcomes: courseData.Outcomes,
              level: courseData.Level,
              estimatedTimeLesson: Number(courseData.EstimatedTimeLesson) || 0,
              price: pricePerLessonNum * allSess.length,
              currency: courseData.Currency,
              numsSessionInWeek: Number(courseData.NumsSessionInWeek) || 0,
              isCertificate: courseData.IsCertificate,
              categoryIds: courseData.CategoryIds,
            });
          } catch {
            // Non-blocking
          }
        }
      } finally {
        setLoading(false);
      }
      setStep(4);
      return;
    }
    // Create mode
    setLoading(true);
    setError("");
    try {
      const allCreatedSessions = {};
      for (const mod of createdModules) {
        const modSessions = sessions[mod.id] || [];
        const modSessionOrder = sessionOrder[mod.id] || [];
        const newSessionsPayload = [];
        const existingSessionsPayload = [];

        if (modSessionOrder.length > 0) {
          modSessionOrder.forEach((item, idx) => {
            const num = idx + 1;
            if (item.type === "new") {
              const sess = modSessions.find((s) => s._key === item._key);
              if (sess?.title.trim()) {
                newSessionsPayload.push({
                  title: sess.title,
                  description: sess.description,
                  outcomes: sess.outcomes,
                  sessionNumber: num,
                });
              }
            } else {
              existingSessionsPayload.push({
                courseSessionId: item.existingId,
                sessionNumber: num,
              });
            }
          });
          // Fallback for sessions not in order
          const orderedKeys = new Set(
            modSessionOrder.filter((i) => i.type === "new").map((i) => i._key),
          );
          modSessions.forEach((s) => {
            if (s.title.trim() && !orderedKeys.has(s._key)) {
              newSessionsPayload.push({
                title: s.title,
                description: s.description,
                outcomes: s.outcomes,
                sessionNumber:
                  newSessionsPayload.length +
                  existingSessionsPayload.length +
                  1,
              });
            }
          });
        } else {
          // No order set — fallback
          const newSess = modSessions.filter((s) => s.title.trim());
          newSess.forEach((s, idx) => {
            newSessionsPayload.push({
              title: s.title,
              description: s.description,
              outcomes: s.outcomes,
              sessionNumber: idx + 1,
            });
          });
          (selectedExistingSessions[mod.id] || []).forEach((id, idx) => {
            existingSessionsPayload.push({
              courseSessionId: id,
              sessionNumber: newSess.length + idx + 1,
            });
          });
        }

        if (
          newSessionsPayload.length === 0 &&
          existingSessionsPayload.length === 0
        )
          continue;
        const payload = {
          courseModuleId: mod.id,
          newCourseSessions: newSessionsPayload,
          courseSessionIdExists: existingSessionsPayload,
        };
        const res = await coursesApi.createCourseSession(payload);
        if (res.isSuccess) {
          allCreatedSessions[mod.id] = res.data.courseSessions || [];
        }
      }
      // Refresh to get join-table IDs
      const sessionsData = await refreshCreatedSessions();
      const allSess = Object.values(sessionsData).flat();

      // Now that session count is known, update course with correct total price
      const pricePerLessonNum =
        Number(courseData.Price.replace(/\./g, "")) || 0;
      if (pricePerLessonNum > 0 && allSess.length > 0 && createdCourseId) {
        try {
          await coursesApi.updateCourse(createdCourseId, {
            title: courseData.Title,
            shortDescription: courseData.ShortDescription,
            fullDescription: courseData.FullDescription,
            outcomes: courseData.Outcomes,
            level: courseData.Level,
            estimatedTimeLesson: Number(courseData.EstimatedTimeLesson) || 0,
            price: pricePerLessonNum * allSess.length,
            currency: courseData.Currency,
            numsSessionInWeek: Number(courseData.NumsSessionInWeek) || 0,
            isCertificate: courseData.IsCertificate,
            categoryIds: courseData.CategoryIds,
          });
        } catch {
          // Non-blocking — price update fails silently, tutor can re-save from Step 1
        }
      }

      const resMap = {};
      const createdResMap = {};
      for (const s of allSess) {
        try {
          const rRes = await coursesApi.getAllCourseResources({
            CourseSessionId: s.id,
            "page-size": 100,
          });
          if (rRes.isSuccess && rRes.data?.items?.length > 0) {
            const items = rRes.data.items;
            resMap[s.id] = items.map((r) => ({
              id: r.id,
              title: r.title || "",
              resourceType: r.resourceType || "",
              url: r.url || "",
              file: null,
            }));
            createdResMap[s.id] = items;
          } else {
            resMap[s.id] = [];
          }
        } catch {
          resMap[s.id] = [];
        }
      }
      setResources((prev) => ({ ...resMap, ...prev }));
      if (Object.keys(createdResMap).length > 0) {
        setCreatedResources(createdResMap);
      }
      const firstSession = allSess[0];
      if (firstSession) {
        setActiveSessionForResources(firstSession.id);
        loadExistingResources(firstSession.id);
      }
      setStep(4);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          t("tutorDashboard.createCourse.error.createFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Create or update resources for each session
  const handleCreateResources = async () => {
    setLoading(true);
    setError("");
    try {
      const isEditing = Object.keys(createdResources).length > 0;

      if (isEditing) {
        // UPDATE existing resources & CREATE new ones
        const allSessions = Object.values(createdSessions).flat();
        const allCreatedResources = {};
        for (const sess of allSessions) {
          const sessResources = resources[sess.id] || [];
          const updatedForSession = [];
          for (const r of sessResources) {
            if (r.id) {
              // Already saved inline — just carry forward
              updatedForSession.push(r);
            } else if (r.title.trim()) {
              // Create new
              const payload = {
                CourseSessionId: sess.id,
                Title: r.title,
                ResourceType: r.resourceType,
              };
              if (r.file) {
                payload.ResourceFile = r.file;
                payload.ResourceFileName = r.file.name;
              }
              const res = await coursesApi.createCourseResource(payload);
              if (res.isSuccess) updatedForSession.push(res.data);
            }
          }
          // Reuse selected existing resources via sessions-resources join table
          const selectedIds = selectedExistingResources[sess.id] || [];
          if (selectedIds.length > 0) {
            await coursesApi.addSessionResource({
              courseSessionId: sess.id,
              courseResources: selectedIds.map((id) => ({
                courseResourceId: id,
              })),
            });
          }
          if (updatedForSession.length > 0) {
            allCreatedResources[sess.id] = updatedForSession;
          }
        }
        // Reload from server so goBackToStep(4) always shows correct fresh data
        await refreshCreatedResources();
        setSelectedExistingResources({});
        setStep(5);
      } else {
        // CREATE mode (original flow)
        const allCreatedResources = {};
        const allSessions = Object.values(createdSessions).flat();
        for (const sess of allSessions) {
          const newRes = (resources[sess.id] || []).filter((r) =>
            r.title.trim(),
          );
          const createdForSession = [];
          for (const r of newRes) {
            const payload = {
              CourseSessionId: sess.id,
              Title: r.title,
              ResourceType: r.resourceType,
            };
            if (r.file) {
              payload.ResourceFile = r.file;
              payload.ResourceFileName = r.file.name;
            }
            const res = await coursesApi.createCourseResource(payload);
            if (res.isSuccess) createdForSession.push(res.data);
          }
          // Reuse selected existing resources via sessions-resources join table
          const selectedIds = selectedExistingResources[sess.id] || [];
          if (selectedIds.length > 0) {
            await coursesApi.addSessionResource({
              courseSessionId: sess.id,
              courseResources: selectedIds.map((id) => ({
                courseResourceId: id,
              })),
            });
          }
          if (createdForSession.length > 0) {
            allCreatedResources[sess.id] = createdForSession;
          }
        }
        setCreatedResources(allCreatedResources);
        setSelectedExistingResources({});
        setStep(5);
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          t("tutorDashboard.createCourse.error.createFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Submit for verification
  const handleSubmitVerification = async () => {
    setLoading(true);
    setError("");
    try {
      await coursesApi.createCourseVerificationRequest(createdCourseId);
      addToast({
        title: t("tutorDashboard.createCourse.submitForVerification"),
        color: "success",
        timeout: 3000,
      });
      navigate("/tutor/my-courses");
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          t("tutorDashboard.createCourse.error.createFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  // Step indicator
  const stepList = [
    { num: 1, label: t("tutorDashboard.createCourse.stepCourseInfo") },
    { num: 2, label: t("tutorDashboard.createCourse.stepModules") },
    { num: 3, label: t("tutorDashboard.createCourse.stepSessions") },
    { num: 4, label: t("tutorDashboard.createCourse.stepResources") },
    { num: 5, label: t("tutorDashboard.createCourse.stepReview") },
  ];

  const StepIndicator = () => (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {stepList.map((s, idx) => (
        <div key={s.num} className="flex items-center gap-2 flex-shrink-0">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => {
              if (s.num < step) goBackToStep(s.num);
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                backgroundColor:
                  step >= s.num ? colors.primary.main : colors.background.gray,
                color:
                  step >= s.num ? colors.text.white : colors.text.secondary,
              }}
            >
              {step > s.num ? (
                <Check weight="BoldDuotone" className="w-5 h-5" />
              ) : (
                s.num
              )}
            </div>
            <span
              className="font-medium text-sm whitespace-nowrap"
              style={{
                color:
                  step >= s.num ? colors.primary.main : colors.text.secondary,
              }}
            >
              {s.label}
            </span>
          </div>
          {idx < stepList.length - 1 && (
            <div
              className="w-8 h-0.5 flex-shrink-0"
              style={{
                backgroundColor:
                  step > s.num ? colors.primary.main : colors.background.gray,
              }}
            />
          )}
        </div>
      ))}
    </div>
  );

  // Existing item picker component
  const ExistingItemPicker = ({
    title,
    description,
    items,
    selectedIds,
    onToggle,
    searchValue,
    onSearchChange,
    loadingItems,
    searchPlaceholder,
    onViewDetail,
  }) => (
    <Card shadow="none" style={{ backgroundColor: colors.background.light }}>
      <CardBody className="p-6 space-y-4">
        <div>
          <h3
            className="text-base font-semibold"
            style={{ color: colors.text.primary }}
          >
            {title}
          </h3>
          <p className="text-sm" style={{ color: colors.text.secondary }}>
            {description}
          </p>
        </div>
        <Input
          placeholder={searchPlaceholder}
          value={searchValue}
          onValueChange={onSearchChange}
          startContent={
            <MinimalisticMagnifier
              weight="BoldDuotone"
              className="w-4 h-4"
              style={{ color: colors.text.tertiary }}
            />
          }
          classNames={inputClassNames}
          size="sm"
        />
        {loadingItems ? (
          <div className="flex justify-center py-4">
            <Spinner size="sm" />
          </div>
        ) : (
          <div className="max-h-60 overflow-y-auto space-y-2">
            {items
              .filter(
                (item) =>
                  !searchValue ||
                  item.title?.toLowerCase().includes(searchValue.toLowerCase()),
              )
              .map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-lg cursor-pointer"
                  style={{
                    backgroundColor: selectedIds.includes(item.id)
                      ? colors.background.primaryLight
                      : colors.background.gray,
                  }}
                  onClick={() => onToggle(item.id)}
                >
                  <Checkbox
                    isSelected={selectedIds.includes(item.id)}
                    onValueChange={() => onToggle(item.id)}
                    size="sm"
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-medium text-sm truncate"
                      style={{ color: colors.text.primary }}
                    >
                      {item.title}
                    </p>
                    {item.description && (
                      <p
                        className="text-xs mt-1 line-clamp-2"
                        style={{ color: colors.text.secondary }}
                      >
                        {item.description}
                      </p>
                    )}
                  </div>
                  {onViewDetail && (
                    <Button
                      isIconOnly
                      variant="light"
                      size="sm"
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        onViewDetail(item.id);
                      }}
                      title={t("tutorDashboard.createCourse.viewDetail")}
                      className="shrink-0"
                    >
                      <Eye weight="BoldDuotone" className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            {items.filter(
              (item) =>
                !searchValue ||
                item.title?.toLowerCase().includes(searchValue.toLowerCase()),
            ).length === 0 && (
              <p
                className="text-sm text-center py-4"
                style={{ color: colors.text.secondary }}
              >
                No items found
              </p>
            )}
          </div>
        )}
        {selectedIds.length > 0 && (
          <p
            className="text-sm font-medium"
            style={{ color: colors.primary.main }}
          >
            {t("tutorDashboard.createCourse.selected")}: {selectedIds.length}
          </p>
        )}
      </CardBody>
    </Card>
  );

  // Render
  if (initialLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Button
          variant="light"
          startContent={
            <AltArrowLeft weight="BoldDuotone" className="w-5 h-5" />
          }
          onPress={() => navigate("/tutor/my-courses")}
          className="mb-4"
          style={{ color: colors.text.secondary }}
        >
          {t("tutorDashboard.createCourse.backToCourses")}
        </Button>
        <h1
          className="text-2xl font-bold"
          style={{ color: colors.text.primary }}
        >
          {continueId
            ? t("tutorDashboard.createCourse.continueTitle")
            : t("tutorDashboard.createCourse.title")}
        </h1>
        <p style={{ color: colors.text.secondary }}>
          {continueId
            ? t("tutorDashboard.createCourse.continueSubtitle")
            : t("tutorDashboard.createCourse.subtitle")}
        </p>
      </motion.div>

      {/* Step indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <StepIndicator />
      </motion.div>

      {/* Error alert */}
      {error && (
        <Alert color="danger" variant="flat" title={error} className="mb-2" />
      )}

      {/* STEP 1: Course Information */}
      {step === 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {/* Basic Info */}
          <Card
            shadow="none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="space-y-5 p-6">
              <h2
                className="text-lg font-semibold"
                style={{ color: colors.text.primary }}
              >
                {t("tutorDashboard.createCourse.basicInfo")}
              </h2>
              <Input
                label={t("tutorDashboard.createCourse.courseTitle")}
                placeholder={t(
                  "tutorDashboard.createCourse.courseTitlePlaceholder",
                )}
                labelPlacement="outside"
                value={courseData.Title}
                onChange={(e) => handleCourseChange("Title", e.target.value)}
                isInvalid={!!validationErrors.Title}
                errorMessage={validationErrors.Title}
                classNames={inputClassNames}
                isRequired
              />
              <Textarea
                label={t("tutorDashboard.createCourse.shortDescription")}
                placeholder={t(
                  "tutorDashboard.createCourse.shortDescPlaceholder",
                )}
                labelPlacement="outside"
                value={courseData.ShortDescription}
                onChange={(e) =>
                  handleCourseChange("ShortDescription", e.target.value)
                }
                isInvalid={!!validationErrors.ShortDescription}
                errorMessage={validationErrors.ShortDescription}
                classNames={inputClassNames}
                minRows={2}
                maxRows={4}
                isRequired
              />
              <Textarea
                label={t("tutorDashboard.createCourse.fullDescription")}
                placeholder={t(
                  "tutorDashboard.createCourse.fullDescPlaceholder",
                )}
                labelPlacement="outside"
                value={courseData.FullDescription}
                onChange={(e) =>
                  handleCourseChange("FullDescription", e.target.value)
                }
                classNames={inputClassNames}
                minRows={4}
                maxRows={8}
              />
              <Textarea
                label={t("tutorDashboard.createCourse.outcomes")}
                placeholder={t(
                  "tutorDashboard.createCourse.outcomesPlaceholder",
                )}
                labelPlacement="outside"
                value={courseData.Outcomes}
                onChange={(e) => handleCourseChange("Outcomes", e.target.value)}
                classNames={inputClassNames}
                minRows={2}
                maxRows={4}
              />
            </CardBody>
          </Card>

          {/* Course Details */}
          <Card
            shadow="none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="space-y-5 p-6">
              <h2
                className="text-lg font-semibold"
                style={{ color: colors.text.primary }}
              >
                {t("tutorDashboard.createCourse.courseDetails")}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                <Select
                  label={t("tutorDashboard.createCourse.level")}
                  placeholder={t(
                    "tutorDashboard.createCourse.levelPlaceholder",
                  )}
                  labelPlacement="outside"
                  selectedKeys={courseData.Level ? [courseData.Level] : []}
                  onSelectionChange={(keys) =>
                    handleCourseChange("Level", Array.from(keys)[0] || "")
                  }
                  isInvalid={!!validationErrors.Level}
                  errorMessage={validationErrors.Level}
                  classNames={selectClassNames}
                  isRequired
                >
                  {LEVELS.map((level) => (
                    <SelectItem key={level}>{level}</SelectItem>
                  ))}
                </Select>
                <div className="flex flex-col gap-1">
                  <Input
                    label={t("tutorDashboard.createCourse.price")}
                    placeholder="0"
                    type="text"
                    inputMode="numeric"
                    labelPlacement="outside"
                    value={courseData.Price}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "");
                      const formatted = raw.replace(
                        /\B(?=(\d{3})+(?!\d))/g,
                        ".",
                      );
                      handleCourseChange("Price", formatted);
                    }}
                    isInvalid={!!validationErrors.Price}
                    errorMessage={validationErrors.Price}
                    classNames={inputClassNames}
                    isRequired
                    endContent={
                      <span
                        className="text-sm"
                        style={{ color: colors.text.tertiary }}
                      >
                        VND
                      </span>
                    }
                  />
                  {(() => {
                    const totalSessions =
                      Object.values(createdSessions).flat().length;
                    const priceNum =
                      Number(courseData.Price.replace(/\./g, "")) || 0;
                    if (totalSessions > 0 && priceNum > 0) {
                      const total = priceNum * totalSessions;
                      return (
                        <p
                          className="text-xs pl-1"
                          style={{ color: colors.state.success }}
                        >
                          Estimated Total: {total.toLocaleString("vi-VN")} VND (
                          {totalSessions} sessions ×{" "}
                          {priceNum.toLocaleString("vi-VN")} VND)
                        </p>
                      );
                    }
                    return (
                      <p
                        className="text-xs pl-1"
                        style={{ color: colors.text.tertiary }}
                      >
                        Total = Price/Lesson × sessions (calculated after Step
                        3)
                      </p>
                    );
                  })()}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label={t("tutorDashboard.createCourse.sessionsPerWeek")}
                  placeholder="0"
                  type="number"
                  labelPlacement="outside"
                  value={courseData.NumsSessionInWeek}
                  onChange={(e) =>
                    handleCourseChange("NumsSessionInWeek", e.target.value)
                  }
                  isInvalid={!!validationErrors.NumsSessionInWeek}
                  errorMessage={validationErrors.NumsSessionInWeek}
                  classNames={inputClassNames}
                  isRequired
                />
                <Input
                  label={t("tutorDashboard.createCourse.estimatedTimeLesson")}
                  placeholder="0"
                  type="number"
                  labelPlacement="outside"
                  value={courseData.EstimatedTimeLesson}
                  onChange={(e) =>
                    handleCourseChange("EstimatedTimeLesson", e.target.value)
                  }
                  isInvalid={!!validationErrors.EstimatedTimeLesson}
                  errorMessage={validationErrors.EstimatedTimeLesson}
                  classNames={inputClassNames}
                  isRequired
                  endContent={
                    <span
                      className="text-sm"
                      style={{ color: colors.text.tertiary }}
                    >
                      {t("tutorDashboard.createCourse.minutes")}
                    </span>
                  }
                />
              </div>
              {/* Categories */}
              {categories.length > 0 && (
                <div className="space-y-4">
                  <p
                    className="text-sm font-medium"
                    style={{ color: colors.text.primary }}
                  >
                    {t("tutorDashboard.createCourse.category")}
                    <span style={{ color: colors.state.error }}> *</span>
                  </p>

                  {/* By Skill — card grid */}
                  {skillCategories.length > 0 && (
                    <div>
                      <p
                        className="text-xs font-semibold uppercase tracking-wider mb-2"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("tutorDashboard.createCourse.categoryBySkill")}
                        <span className="ml-1 font-normal normal-case tracking-normal">
                          {" "}
                          {t("tutorDashboard.createCourse.categorySkillHint")}
                        </span>
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {skillCategories.map((cat) => {
                          const { Icon, color, iconBg } = getSkillStyle(
                            cat.name,
                          );
                          const isSelected = courseData.CategoryIds.includes(
                            cat.id,
                          );
                          const isDisabled =
                            !isSelected && courseData.CategoryIds.length >= 3;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              disabled={isDisabled}
                              className="relative flex items-center gap-3 p-3 rounded-xl text-left transition-all"
                              style={{
                                backgroundColor: isSelected
                                  ? iconBg
                                  : colors.background.gray,
                                opacity: isDisabled ? 0.4 : 1,
                                cursor: isDisabled ? "not-allowed" : "pointer",
                              }}
                              onClick={() => {
                                if (isDisabled) return;
                                setCourseData((prev) => ({
                                  ...prev,
                                  CategoryIds: prev.CategoryIds.includes(cat.id)
                                    ? prev.CategoryIds.filter(
                                        (id) => id !== cat.id,
                                      )
                                    : [...prev.CategoryIds, cat.id],
                                }));
                              }}
                            >
                              <div
                                className="w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center"
                                style={{ backgroundColor: iconBg }}
                              >
                                <Icon
                                  size={18}
                                  weight="BoldDuotone"
                                  style={{ color }}
                                />
                              </div>
                              <span
                                className="text-xs font-medium leading-tight"
                                style={{
                                  color: isSelected
                                    ? color
                                    : colors.text.primary,
                                }}
                              >
                                {cat.name}
                              </span>
                              {isSelected && (
                                <Check
                                  size={16}
                                  weight="BoldDuotone"
                                  style={{
                                    color,
                                    position: "absolute",
                                    top: 6,
                                    right: 6,
                                  }}
                                />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* By Purpose — pill toggles */}
                  {purposeCategories.length > 0 && (
                    <div>
                      <p
                        className="text-xs font-semibold uppercase tracking-wider mb-2"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("tutorDashboard.createCourse.categoryByPurpose")}
                        <span className="ml-1 font-normal normal-case tracking-normal">
                          {" "}
                          {t("tutorDashboard.createCourse.categoryPurposeHint")}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {purposeCategories.map((cat) => {
                          const isSelected = courseData.CategoryIds.includes(
                            cat.id,
                          );
                          const isDisabled =
                            !isSelected && courseData.CategoryIds.length >= 3;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              disabled={isDisabled}
                              className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                              style={{
                                backgroundColor: isSelected
                                  ? "rgba(16,185,129,0.1)"
                                  : colors.background.gray,
                                color: isSelected
                                  ? "#10B981"
                                  : colors.text.primary,
                                opacity: isDisabled ? 0.4 : 1,
                                cursor: isDisabled ? "not-allowed" : "pointer",
                              }}
                              onClick={() => {
                                if (isDisabled) return;
                                setCourseData((prev) => ({
                                  ...prev,
                                  CategoryIds: prev.CategoryIds.includes(cat.id)
                                    ? prev.CategoryIds.filter(
                                        (id) => id !== cat.id,
                                      )
                                    : [...prev.CategoryIds, cat.id],
                                }));
                              }}
                            >
                              {cat.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {validationErrors.CategoryIds && (
                    <p
                      className="text-xs mt-1 pl-1"
                      style={{ color: colors.state.error }}
                    >
                      {validationErrors.CategoryIds}
                    </p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Media */}
          <Card
            shadow="none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="space-y-5 p-6">
              <h2
                className="text-lg font-semibold"
                style={{ color: colors.text.primary }}
              >
                {t("tutorDashboard.createCourse.media")}
              </h2>
              <div>
                <p
                  className="text-sm font-medium mb-2"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorDashboard.createCourse.thumbnail")}
                </p>
                <label
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer"
                  style={{ borderColor: colors.border.light }}
                >
                  <Gallery
                    weight="BoldDuotone"
                    className="w-6 h-6"
                    style={{ color: colors.text.tertiary }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {thumbnailFile
                      ? thumbnailFile.name
                      : existingThumbnailUrl
                        ? t("tutorDashboard.createCourse.changeFile")
                        : t("tutorDashboard.createCourse.noFileChosen")}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      setThumbnailFile(e.target.files?.[0] || null);
                      setThumbnailChanged(true);
                    }}
                  />
                </label>
                {thumbnailFile ? (
                  <div className="mt-3 relative inline-block">
                    <img
                      src={URL.createObjectURL(thumbnailFile)}
                      alt="Thumbnail preview"
                      className="rounded-lg object-cover max-h-48 w-auto"
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="solid"
                      className="absolute top-1 right-1 min-w-6 w-6 h-6"
                      onPress={() => setThumbnailFile(null)}
                    >
                      <TrashBinMinimalistic
                        weight="BoldDuotone"
                        className="w-3 h-3"
                      />
                    </Button>
                  </div>
                ) : existingThumbnailUrl ? (
                  <div className="mt-3 relative inline-block">
                    <img
                      src={existingThumbnailUrl}
                      alt="Thumbnail preview"
                      className="rounded-lg object-cover max-h-48 w-auto"
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="solid"
                      className="absolute top-1 right-1 min-w-6 w-6 h-6"
                      onPress={() => setExistingThumbnailUrl(null)}
                    >
                      <TrashBinMinimalistic
                        weight="BoldDuotone"
                        className="w-3 h-3"
                      />
                    </Button>
                  </div>
                ) : null}
              </div>
              <div>
                <p
                  className="text-sm font-medium mb-2"
                  style={{ color: colors.text.primary }}
                >
                  {t("tutorDashboard.createCourse.demoVideo")}
                </p>
                <label
                  className="flex items-center gap-3 p-3 rounded-xl border-2 border-dashed cursor-pointer"
                  style={{ borderColor: colors.border.light }}
                >
                  <Videocamera
                    weight="BoldDuotone"
                    className="w-6 h-6"
                    style={{ color: colors.text.tertiary }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {demoVideoFile
                      ? demoVideoFile.name
                      : existingDemoVideoUrl
                        ? t("tutorDashboard.createCourse.changeFile")
                        : t("tutorDashboard.createCourse.noFileChosen")}
                  </span>
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      setDemoVideoFile(e.target.files?.[0] || null);
                      setDemoVideoChanged(true);
                    }}
                  />
                </label>
                {demoVideoFile ? (
                  <div className="mt-3 relative inline-block">
                    <video
                      src={URL.createObjectURL(demoVideoFile)}
                      controls
                      className="rounded-lg max-h-56 w-auto"
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="solid"
                      className="absolute top-1 right-1 min-w-6 w-6 h-6"
                      onPress={() => setDemoVideoFile(null)}
                    >
                      <TrashBinMinimalistic
                        weight="BoldDuotone"
                        className="w-3 h-3"
                      />
                    </Button>
                  </div>
                ) : existingDemoVideoUrl ? (
                  <div className="mt-3 relative inline-block w-full">
                    <video
                      src={existingDemoVideoUrl}
                      controls
                      className="rounded-lg max-h-56 w-auto"
                    />
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      variant="solid"
                      className="absolute top-1 right-1 min-w-6 w-6 h-6"
                      onPress={() => setExistingDemoVideoUrl(null)}
                    >
                      <TrashBinMinimalistic
                        weight="BoldDuotone"
                        className="w-3 h-3"
                      />
                    </Button>
                  </div>
                ) : null}
              </div>
            </CardBody>
          </Card>

          <div className="flex justify-end">
            <Button
              color="primary"
              size="lg"
              onPress={handleCreateCourse}
              isLoading={loading}
              isDisabled={loading}
              style={{
                backgroundColor: colors.primary.main,
                color: colors.text.white,
              }}
              endContent={
                !loading && (
                  <AltArrowRight weight="BoldDuotone" className="w-5 h-5" />
                )
              }
            >
              {loading
                ? createdCourseId
                  ? t("tutorDashboard.createCourse.saving")
                  : t("tutorDashboard.createCourse.creating")
                : t("tutorDashboard.createCourse.nextAddModules")}
            </Button>
          </div>
        </motion.div>
      )}

      {/* STEP 2: Course Modules */}
      {step === 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {/* ===== SAVED MODULES (edit mode) ===== */}
          {createdModules.length > 0 && (
            <>
              {createdModules.map((mod) => {
                const isEditingThis = editingCreatedModuleId === mod.id;
                return (
                  <Card
                    key={mod.id}
                    shadow="none"
                    style={{ backgroundColor: colors.background.light }}
                  >
                    <CardBody className="space-y-4 p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                            style={{
                              backgroundColor: colors.primary.main,
                              color: colors.text.white,
                            }}
                          >
                            {mod.moduleNumber}
                          </span>
                          <h3
                            className="text-base font-semibold"
                            style={{ color: colors.text.primary }}
                          >
                            {t("tutorDashboard.createCourse.moduleNumber", {
                              number: mod.moduleNumber,
                            })}
                          </h3>
                        </div>
                        <div className="flex items-center gap-1">
                          {!isEditingThis && (
                            <Button
                              isIconOnly
                              variant="light"
                              size="sm"
                              onPress={() => startEditCreatedModule(mod.id)}
                              title={t("tutorDashboard.createCourse.editItem")}
                            >
                              <Pen weight="BoldDuotone" className="w-4 h-4" />
                            </Button>
                          )}
                          {isEditingThis && (
                            <>
                              <Button
                                size="sm"
                                variant="flat"
                                color="danger"
                                onPress={cancelEditCreatedModule}
                                startContent={
                                  <CloseSquare
                                    weight="BoldDuotone"
                                    className="w-4 h-4"
                                  />
                                }
                              >
                                {t("tutorDashboard.createCourse.cancel")}
                              </Button>
                              <Button
                                size="sm"
                                color="primary"
                                onPress={() => saveEditCreatedModule(mod.id)}
                                isLoading={savingModule}
                                startContent={
                                  !savingModule && (
                                    <Diskette
                                      weight="BoldDuotone"
                                      className="w-4 h-4"
                                    />
                                  )
                                }
                              >
                                {t("tutorDashboard.createCourse.saveItem")}
                              </Button>
                            </>
                          )}
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => loadModuleHistory(mod.id, mod.title)}
                            title={t(
                              "tutorDashboard.createCourse.versionHistory.title",
                            )}
                          >
                            <History weight="BoldDuotone" className="w-4 h-4" />
                          </Button>
                          <Button
                            isIconOnly
                            variant="light"
                            color="danger"
                            size="sm"
                            isLoading={deletingModuleId === mod.id}
                            onPress={() =>
                              setDeleteConfirm({
                                type: "createdModule",
                                moduleId: mod.id,
                              })
                            }
                          >
                            <TrashBinMinimalistic
                              weight="BoldDuotone"
                              className="w-4 h-4"
                            />
                          </Button>
                        </div>
                      </div>
                      <Input
                        label={t("tutorDashboard.createCourse.moduleTitle")}
                        placeholder={t(
                          "tutorDashboard.createCourse.moduleTitlePlaceholder",
                        )}
                        labelPlacement="outside"
                        value={mod.title}
                        onChange={(e) =>
                          handleCreatedModuleChange(
                            mod.id,
                            "title",
                            e.target.value,
                          )
                        }
                        classNames={inputClassNames}
                        isRequired
                        isDisabled={!isEditingThis}
                      />
                      <Textarea
                        label={t(
                          "tutorDashboard.createCourse.moduleDescription",
                        )}
                        placeholder={t(
                          "tutorDashboard.createCourse.moduleDescPlaceholder",
                        )}
                        labelPlacement="outside"
                        value={mod.description}
                        onChange={(e) =>
                          handleCreatedModuleChange(
                            mod.id,
                            "description",
                            e.target.value,
                          )
                        }
                        classNames={inputClassNames}
                        minRows={2}
                        maxRows={4}
                        isDisabled={!isEditingThis}
                      />
                      <Textarea
                        label={t("tutorDashboard.createCourse.moduleOutcomes")}
                        placeholder={t(
                          "tutorDashboard.createCourse.moduleOutcomesPlaceholder",
                        )}
                        labelPlacement="outside"
                        value={mod.outcomes}
                        onChange={(e) =>
                          handleCreatedModuleChange(
                            mod.id,
                            "outcomes",
                            e.target.value,
                          )
                        }
                        classNames={inputClassNames}
                        minRows={2}
                        maxRows={3}
                        isDisabled={!isEditingThis}
                      />
                    </CardBody>
                  </Card>
                );
              })}

              <Divider />
              <h3
                className="text-lg font-semibold"
                style={{ color: colors.text.primary }}
              >
                {t("tutorDashboard.createCourse.addModule")}
              </h3>
            </>
          )}

          {/* ===== REUSE EXISTING MODULES ===== */}
          <ExistingItemPicker
            title={t("tutorDashboard.createCourse.existingModules")}
            description={t("tutorDashboard.createCourse.existingModulesDesc")}
            items={existingModules}
            selectedIds={selectedExistingModules}
            onToggle={(id) =>
              setSelectedExistingModules((prev) =>
                prev.includes(id)
                  ? prev.filter((x) => x !== id)
                  : [...prev, id],
              )
            }
            searchValue={moduleSearch}
            onSearchChange={setModuleSearch}
            loadingItems={loadingExistingModules}
            searchPlaceholder={t("tutorDashboard.createCourse.searchModules")}
            onViewDetail={handleViewModuleDetail}
          />

          {/* ===== NEW MODULE CARDS ===== */}
          {modules.map((mod, index) => (
            <Card
              key={mod._key || index}
              shadow="none"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="space-y-4 p-6">
                <div className="flex items-center justify-between">
                  <h3
                    className="text-base font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    {t("tutorDashboard.createCourse.moduleNumber", {
                      number: mod.moduleNumber,
                    })}
                  </h3>
                  {(modules.length > 1 ||
                    selectedExistingModules.length > 0 ||
                    createdModules.length > 0) && (
                    <Button
                      isIconOnly
                      variant="light"
                      color="danger"
                      size="sm"
                      onPress={() =>
                        setDeleteConfirm({ type: "module", index })
                      }
                    >
                      <TrashBinMinimalistic
                        weight="BoldDuotone"
                        className="w-4 h-4"
                      />
                    </Button>
                  )}
                </div>
                <Input
                  label={t("tutorDashboard.createCourse.moduleTitle")}
                  placeholder={t(
                    "tutorDashboard.createCourse.moduleTitlePlaceholder",
                  )}
                  labelPlacement="outside"
                  value={mod.title}
                  onChange={(e) =>
                    handleModuleChange(index, "title", e.target.value)
                  }
                  classNames={inputClassNames}
                  isRequired
                />
                <Textarea
                  label={t("tutorDashboard.createCourse.moduleDescription")}
                  placeholder={t(
                    "tutorDashboard.createCourse.moduleDescPlaceholder",
                  )}
                  labelPlacement="outside"
                  value={mod.description}
                  onChange={(e) =>
                    handleModuleChange(index, "description", e.target.value)
                  }
                  classNames={inputClassNames}
                  minRows={2}
                  maxRows={4}
                />
                <Textarea
                  label={t("tutorDashboard.createCourse.moduleOutcomes")}
                  placeholder={t(
                    "tutorDashboard.createCourse.moduleOutcomesPlaceholder",
                  )}
                  labelPlacement="outside"
                  value={mod.outcomes}
                  onChange={(e) =>
                    handleModuleChange(index, "outcomes", e.target.value)
                  }
                  classNames={inputClassNames}
                  minRows={2}
                  maxRows={3}
                />
              </CardBody>
            </Card>
          ))}

          <Button
            variant="flat"
            startContent={
              <AddCircle weight="BoldDuotone" className="w-5 h-5" />
            }
            onPress={addModule}
            className="w-full"
            style={{
              backgroundColor: colors.background.primaryLight,
              color: colors.primary.main,
            }}
          >
            {t("tutorDashboard.createCourse.addModule")}
          </Button>

          {/* ===== ARRANGE ORDER ===== */}
          {moduleOrder.length > 1 && (
            <Card
              shadow="none"
              style={{ backgroundColor: colors.background.light }}
            >
              <CardBody className="p-6 space-y-3">
                <div>
                  <h3
                    className="text-base font-semibold"
                    style={{ color: colors.text.primary }}
                  >
                    {t("tutorDashboard.createCourse.arrangeOrder")}
                  </h3>
                  <p
                    className="text-sm"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("tutorDashboard.createCourse.arrangeOrderDesc")}
                  </p>
                </div>
                {/* Saved modules (fixed) */}
                {createdModules.length > 0 && (
                  <div className="space-y-2 mb-2">
                    {createdModules.map((cm) => (
                      <div
                        key={cm.id}
                        className="flex items-center gap-3 p-3 rounded-lg opacity-60"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            backgroundColor: colors.text.tertiary,
                            color: colors.text.white,
                          }}
                        >
                          {cm.moduleNumber}
                        </span>
                        <span
                          className="text-sm font-medium truncate flex-1"
                          style={{ color: colors.text.primary }}
                        >
                          {cm.title || "(untitled)"}
                        </span>
                        <Chip size="sm" variant="flat">
                          {t("tutorDashboard.createCourse.saved")}
                        </Chip>
                      </div>
                    ))}
                  </div>
                )}
                {/* New modules (movable) */}
                <div className="space-y-2">
                  {moduleOrder.map((item, index) => {
                    const info = getModuleOrderInfo(item);
                    return (
                      <div
                        key={item.type === "new" ? item._key : item.existingId}
                        className="flex items-center gap-3 p-3 rounded-lg"
                        style={{ backgroundColor: colors.background.gray }}
                      >
                        <span
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            backgroundColor: colors.primary.main,
                            color: colors.text.white,
                          }}
                        >
                          {(createdModules.length > 0
                            ? createdModules.reduce(
                                (max, m) => Math.max(max, m.moduleNumber || 0),
                                0,
                              )
                            : 0) +
                            index +
                            1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span
                            className="text-sm font-medium truncate block"
                            style={{ color: colors.text.primary }}
                          >
                            {info.title}
                          </span>
                          {info.desc && (
                            <span
                              className="text-xs truncate block"
                              style={{ color: colors.text.tertiary }}
                            >
                              {info.desc}
                            </span>
                          )}
                        </div>
                        <Chip
                          size="sm"
                          variant="flat"
                          style={{
                            backgroundColor:
                              item.type === "existing"
                                ? colors.background.primaryLight
                                : colors.background.gray,
                            color:
                              item.type === "existing"
                                ? colors.primary.main
                                : colors.text.secondary,
                          }}
                        >
                          {info.tag}
                        </Chip>
                        <div className="flex flex-col">
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            isDisabled={index === 0}
                            onPress={() => moveModuleOrder(index, -1)}
                            className="w-6 h-6 min-w-6"
                          >
                            <AltArrowUp
                              weight="BoldDuotone"
                              className="w-3.5 h-3.5"
                            />
                          </Button>
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            isDisabled={index === moduleOrder.length - 1}
                            onPress={() => moveModuleOrder(index, 1)}
                            className="w-6 h-6 min-w-6"
                          >
                            <AltArrowDown
                              weight="BoldDuotone"
                              className="w-3.5 h-3.5"
                            />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardBody>
            </Card>
          )}

          {/* ===== SAVE NEW MODULES BUTTON (edit mode) ===== */}
          {createdModules.length > 0 &&
            (modules.length > 0 || selectedExistingModules.length > 0) && (
              <Button
                color="success"
                size="lg"
                className="w-full text-white"
                onPress={handleSaveNewModules}
                isLoading={savingNewModules}
                isDisabled={savingNewModules}
                startContent={
                  !savingNewModules && (
                    <Diskette weight="BoldDuotone" className="w-5 h-5" />
                  )
                }
              >
                {t("tutorDashboard.createCourse.saveNewModules")}
              </Button>
            )}

          <Divider />
          <div className="flex justify-between gap-4">
            <Button
              variant="flat"
              size="lg"
              onPress={() => goBackToStep(1)}
              startContent={
                <AltArrowLeft weight="BoldDuotone" className="w-5 h-5" />
              }
              style={{ color: colors.text.secondary }}
            >
              {t("tutorDashboard.createCourse.back")}
            </Button>
            <Button
              color="primary"
              size="lg"
              onPress={handleCreateModules}
              isLoading={loading}
              isDisabled={
                loading ||
                (createdModules.length === 0 &&
                  modules.length === 0 &&
                  selectedExistingModules.length === 0)
              }
              style={{
                backgroundColor: colors.primary.main,
                color: colors.text.white,
              }}
              endContent={
                !loading && (
                  <AltArrowRight weight="BoldDuotone" className="w-5 h-5" />
                )
              }
            >
              {loading
                ? t("tutorDashboard.createCourse.creating")
                : t("tutorDashboard.createCourse.nextAddSessions")}
            </Button>
          </div>
        </motion.div>
      )}

      {/* STEP 3: Sessions per Module */}
      {step === 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {createdModules.length === 0 ? (
            <Alert
              color="warning"
              variant="flat"
              title={t("tutorDashboard.createCourse.noModulesForSessions")}
            />
          ) : (
            <>
              {/* Module tabs */}
              <Card
                shadow="none"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-4 space-y-3">
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("tutorDashboard.createCourse.selectModule")}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {createdModules.map((mod) => (
                      <Chip
                        key={mod.id}
                        variant={
                          activeModuleForSessions === mod.id ? "solid" : "flat"
                        }
                        className="cursor-pointer"
                        style={{
                          backgroundColor:
                            activeModuleForSessions === mod.id
                              ? colors.primary.main
                              : colors.background.gray,
                          color:
                            activeModuleForSessions === mod.id
                              ? colors.text.white
                              : colors.text.primary,
                        }}
                        onClick={() => {
                          setActiveModuleForSessions(mod.id);
                          loadExistingSessions(mod.id);
                        }}
                      >
                        {mod.title}
                      </Chip>
                    ))}
                  </div>
                </CardBody>
              </Card>

              {activeModuleForSessions && (
                <>
                  {/* ===== SAVED SESSIONS (edit mode) ===== */}
                  {(createdSessions[activeModuleForSessions] || []).map(
                    (sess) => {
                      const sessKey = `${activeModuleForSessions}-${sess.id}`;
                      const isEditingSess =
                        editingCreatedSessionKey === sessKey;
                      return (
                        <Card
                          key={sess.id}
                          shadow="none"
                          style={{
                            backgroundColor: colors.background.light,
                          }}
                        >
                          <CardBody className="space-y-4 p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                  style={{
                                    backgroundColor: colors.primary.main,
                                    color: colors.text.white,
                                  }}
                                >
                                  {sess.sessionNumber}
                                </span>
                                <h3
                                  className="text-base font-semibold"
                                  style={{ color: colors.text.primary }}
                                >
                                  {t(
                                    "tutorDashboard.createCourse.sessionNumber",
                                    { number: sess.sessionNumber },
                                  )}
                                </h3>
                              </div>
                              <div className="flex items-center gap-1">
                                {!isEditingSess && (
                                  <Button
                                    isIconOnly
                                    variant="light"
                                    size="sm"
                                    onPress={() =>
                                      startEditCreatedSession(
                                        activeModuleForSessions,
                                        sess.id,
                                      )
                                    }
                                    title={t(
                                      "tutorDashboard.createCourse.editItem",
                                    )}
                                  >
                                    <Pen
                                      weight="BoldDuotone"
                                      className="w-4 h-4"
                                    />
                                  </Button>
                                )}
                                {isEditingSess && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="flat"
                                      color="danger"
                                      onPress={cancelEditCreatedSession}
                                      startContent={
                                        <CloseSquare
                                          weight="BoldDuotone"
                                          className="w-4 h-4"
                                        />
                                      }
                                    >
                                      {t("tutorDashboard.createCourse.cancel")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      color="primary"
                                      onPress={() =>
                                        saveEditCreatedSession(
                                          activeModuleForSessions,
                                          sess.id,
                                        )
                                      }
                                      isLoading={savingSession}
                                      startContent={
                                        !savingSession && (
                                          <Diskette
                                            weight="BoldDuotone"
                                            className="w-4 h-4"
                                          />
                                        )
                                      }
                                    >
                                      {t(
                                        "tutorDashboard.createCourse.saveItem",
                                      )}
                                    </Button>
                                  </>
                                )}
                                <Button
                                  isIconOnly
                                  variant="light"
                                  size="sm"
                                  onPress={() =>
                                    loadSessionHistory(sess.id, sess.title)
                                  }
                                  title={t(
                                    "tutorDashboard.createCourse.versionHistory.title",
                                  )}
                                >
                                  <History
                                    weight="BoldDuotone"
                                    className="w-4 h-4"
                                  />
                                </Button>
                                <Button
                                  isIconOnly
                                  variant="light"
                                  color="danger"
                                  size="sm"
                                  isLoading={deletingSessionKey === sessKey}
                                  onPress={() =>
                                    setDeleteConfirm({
                                      type: "createdSession",
                                      moduleId: activeModuleForSessions,
                                      sessionId: sess.id,
                                    })
                                  }
                                >
                                  <TrashBinMinimalistic
                                    weight="BoldDuotone"
                                    className="w-4 h-4"
                                  />
                                </Button>
                              </div>
                            </div>
                            <Input
                              label={t(
                                "tutorDashboard.createCourse.sessionTitle",
                              )}
                              placeholder={t(
                                "tutorDashboard.createCourse.sessionTitlePlaceholder",
                              )}
                              labelPlacement="outside"
                              value={sess.title}
                              onChange={(e) =>
                                handleCreatedSessionChange(
                                  activeModuleForSessions,
                                  sess.id,
                                  "title",
                                  e.target.value,
                                )
                              }
                              classNames={inputClassNames}
                              isRequired
                              isDisabled={!isEditingSess}
                            />
                            <Textarea
                              label={t(
                                "tutorDashboard.createCourse.sessionDescription",
                              )}
                              placeholder={t(
                                "tutorDashboard.createCourse.sessionDescPlaceholder",
                              )}
                              labelPlacement="outside"
                              value={sess.description}
                              onChange={(e) =>
                                handleCreatedSessionChange(
                                  activeModuleForSessions,
                                  sess.id,
                                  "description",
                                  e.target.value,
                                )
                              }
                              classNames={inputClassNames}
                              minRows={2}
                              maxRows={4}
                              isDisabled={!isEditingSess}
                            />
                            <Textarea
                              label={t(
                                "tutorDashboard.createCourse.sessionOutcomes",
                              )}
                              placeholder={t(
                                "tutorDashboard.createCourse.sessionOutcomesPlaceholder",
                              )}
                              labelPlacement="outside"
                              value={sess.outcomes}
                              onChange={(e) =>
                                handleCreatedSessionChange(
                                  activeModuleForSessions,
                                  sess.id,
                                  "outcomes",
                                  e.target.value,
                                )
                              }
                              classNames={inputClassNames}
                              minRows={2}
                              maxRows={3}
                              isDisabled={!isEditingSess}
                            />
                          </CardBody>
                        </Card>
                      );
                    },
                  )}

                  {/* Divider between saved and new (edit mode) */}
                  {(createdSessions[activeModuleForSessions] || []).length >
                    0 && (
                    <>
                      <Divider />
                      <h3
                        className="text-lg font-semibold"
                        style={{ color: colors.text.primary }}
                      >
                        {t("tutorDashboard.createCourse.addSession")}
                      </h3>
                    </>
                  )}

                  {/* ===== REUSE EXISTING SESSIONS ===== */}
                  <ExistingItemPicker
                    title={t("tutorDashboard.createCourse.existingSessions")}
                    description={t(
                      "tutorDashboard.createCourse.existingSessionsDesc",
                    )}
                    items={existingSessions}
                    selectedIds={
                      selectedExistingSessions[activeModuleForSessions] || []
                    }
                    onToggle={(id) =>
                      setSelectedExistingSessions((prev) => {
                        const current = prev[activeModuleForSessions] || [];
                        return {
                          ...prev,
                          [activeModuleForSessions]: current.includes(id)
                            ? current.filter((x) => x !== id)
                            : [...current, id],
                        };
                      })
                    }
                    searchValue={sessionSearch}
                    onSearchChange={setSessionSearch}
                    loadingItems={loadingExistingSessions}
                    searchPlaceholder={t(
                      "tutorDashboard.createCourse.searchSessions",
                    )}
                  />

                  {/* ===== NEW SESSION CARDS ===== */}
                  {getSessionsForModule(activeModuleForSessions).map(
                    (sess, index) => (
                      <Card
                        key={sess._key || index}
                        shadow="none"
                        style={{ backgroundColor: colors.background.light }}
                      >
                        <CardBody className="space-y-4 p-6">
                          <div className="flex items-center justify-between">
                            <h3
                              className="text-base font-semibold"
                              style={{ color: colors.text.primary }}
                            >
                              {t("tutorDashboard.createCourse.sessionNumber", {
                                number: sess.sessionNumber,
                              })}
                            </h3>
                            <Button
                              isIconOnly
                              variant="light"
                              color="danger"
                              size="sm"
                              onPress={() =>
                                setDeleteConfirm({
                                  type: "session",
                                  index,
                                  moduleId: activeModuleForSessions,
                                })
                              }
                            >
                              <TrashBinMinimalistic
                                weight="BoldDuotone"
                                className="w-4 h-4"
                              />
                            </Button>
                          </div>
                          <Input
                            label={t(
                              "tutorDashboard.createCourse.sessionTitle",
                            )}
                            placeholder={t(
                              "tutorDashboard.createCourse.sessionTitlePlaceholder",
                            )}
                            labelPlacement="outside"
                            value={sess.title}
                            onChange={(e) =>
                              handleSessionChange(
                                activeModuleForSessions,
                                index,
                                "title",
                                e.target.value,
                              )
                            }
                            classNames={inputClassNames}
                            isRequired
                          />
                          <Textarea
                            label={t(
                              "tutorDashboard.createCourse.sessionDescription",
                            )}
                            placeholder={t(
                              "tutorDashboard.createCourse.sessionDescPlaceholder",
                            )}
                            labelPlacement="outside"
                            value={sess.description}
                            onChange={(e) =>
                              handleSessionChange(
                                activeModuleForSessions,
                                index,
                                "description",
                                e.target.value,
                              )
                            }
                            classNames={inputClassNames}
                            minRows={2}
                            maxRows={4}
                          />
                          <Textarea
                            label={t(
                              "tutorDashboard.createCourse.sessionOutcomes",
                            )}
                            placeholder={t(
                              "tutorDashboard.createCourse.sessionOutcomesPlaceholder",
                            )}
                            labelPlacement="outside"
                            value={sess.outcomes}
                            onChange={(e) =>
                              handleSessionChange(
                                activeModuleForSessions,
                                index,
                                "outcomes",
                                e.target.value,
                              )
                            }
                            classNames={inputClassNames}
                            minRows={2}
                            maxRows={3}
                          />
                        </CardBody>
                      </Card>
                    ),
                  )}

                  <Button
                    variant="flat"
                    startContent={
                      <AddCircle weight="BoldDuotone" className="w-5 h-5" />
                    }
                    onPress={() => addSession(activeModuleForSessions)}
                    className="w-full"
                    style={{
                      backgroundColor: colors.background.primaryLight,
                      color: colors.primary.main,
                    }}
                  >
                    {t("tutorDashboard.createCourse.addSession")}
                  </Button>

                  {/* ===== ARRANGE SESSION ORDER ===== */}
                  {(sessionOrder[activeModuleForSessions] || []).length > 1 && (
                    <Card
                      shadow="none"
                      style={{
                        backgroundColor: colors.background.light,
                      }}
                    >
                      <CardBody className="p-6 space-y-3">
                        <div>
                          <h3
                            className="text-base font-semibold"
                            style={{ color: colors.text.primary }}
                          >
                            {t("tutorDashboard.createCourse.arrangeOrder")}
                          </h3>
                          <p
                            className="text-sm"
                            style={{ color: colors.text.secondary }}
                          >
                            {t(
                              "tutorDashboard.createCourse.arrangeSessionOrderDesc",
                            )}
                          </p>
                        </div>
                        {/* Saved sessions (fixed) */}
                        {(createdSessions[activeModuleForSessions] || [])
                          .length > 0 && (
                          <div className="space-y-2 mb-2">
                            {(
                              createdSessions[activeModuleForSessions] || []
                            ).map((cs) => (
                              <div
                                key={cs.id}
                                className="flex items-center gap-3 p-3 rounded-lg opacity-60"
                                style={{
                                  backgroundColor: colors.background.gray,
                                }}
                              >
                                <span
                                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                  style={{
                                    backgroundColor: colors.text.tertiary,
                                    color: colors.text.white,
                                  }}
                                >
                                  {cs.sessionNumber}
                                </span>
                                <span
                                  className="text-sm font-medium truncate flex-1"
                                  style={{ color: colors.text.primary }}
                                >
                                  {cs.title || "(untitled)"}
                                </span>
                                <Chip size="sm" variant="flat">
                                  {t("tutorDashboard.createCourse.saved")}
                                </Chip>
                              </div>
                            ))}
                          </div>
                        )}
                        {/* New sessions (movable) */}
                        <div className="space-y-2">
                          {(sessionOrder[activeModuleForSessions] || []).map(
                            (item, index) => {
                              const info = getSessionOrderInfo(
                                activeModuleForSessions,
                                item,
                              );
                              const savedMax = (
                                createdSessions[activeModuleForSessions] || []
                              ).reduce(
                                (max, s) => Math.max(max, s.sessionNumber || 0),
                                0,
                              );
                              return (
                                <div
                                  key={
                                    item.type === "new"
                                      ? item._key
                                      : item.existingId
                                  }
                                  className="flex items-center gap-3 p-3 rounded-lg"
                                  style={{
                                    backgroundColor: colors.background.gray,
                                  }}
                                >
                                  <span
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                                    style={{
                                      backgroundColor: colors.primary.main,
                                      color: colors.text.white,
                                    }}
                                  >
                                    {savedMax + index + 1}
                                  </span>
                                  <div className="flex-1 min-w-0">
                                    <span
                                      className="text-sm font-medium truncate block"
                                      style={{
                                        color: colors.text.primary,
                                      }}
                                    >
                                      {info.title}
                                    </span>
                                    {info.desc && (
                                      <span
                                        className="text-xs truncate block"
                                        style={{
                                          color: colors.text.tertiary,
                                        }}
                                      >
                                        {info.desc}
                                      </span>
                                    )}
                                  </div>
                                  <Chip
                                    size="sm"
                                    variant="flat"
                                    style={{
                                      backgroundColor:
                                        item.type === "existing"
                                          ? colors.background.primaryLight
                                          : colors.background.gray,
                                      color:
                                        item.type === "existing"
                                          ? colors.primary.main
                                          : colors.text.secondary,
                                    }}
                                  >
                                    {info.tag}
                                  </Chip>
                                  <div className="flex flex-col">
                                    <Button
                                      isIconOnly
                                      variant="light"
                                      size="sm"
                                      isDisabled={index === 0}
                                      onPress={() =>
                                        moveSessionOrder(
                                          activeModuleForSessions,
                                          index,
                                          -1,
                                        )
                                      }
                                      className="w-6 h-6 min-w-6"
                                    >
                                      <AltArrowUp
                                        weight="BoldDuotone"
                                        className="w-3.5 h-3.5"
                                      />
                                    </Button>
                                    <Button
                                      isIconOnly
                                      variant="light"
                                      size="sm"
                                      isDisabled={
                                        index ===
                                        (
                                          sessionOrder[
                                            activeModuleForSessions
                                          ] || []
                                        ).length -
                                          1
                                      }
                                      onPress={() =>
                                        moveSessionOrder(
                                          activeModuleForSessions,
                                          index,
                                          1,
                                        )
                                      }
                                      className="w-6 h-6 min-w-6"
                                    >
                                      <AltArrowDown
                                        weight="BoldDuotone"
                                        className="w-3.5 h-3.5"
                                      />
                                    </Button>
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      </CardBody>
                    </Card>
                  )}

                  {/* ===== SAVE NEW SESSIONS BUTTON (edit mode) ===== */}
                  {Object.keys(createdSessions).length > 0 &&
                    ((sessions[activeModuleForSessions] || []).length > 0 ||
                      (selectedExistingSessions[activeModuleForSessions] || [])
                        .length > 0) && (
                      <Button
                        color="success"
                        size="lg"
                        className="w-full text-white"
                        onPress={handleSaveNewSessions}
                        isLoading={savingNewSessions}
                        isDisabled={savingNewSessions}
                        startContent={
                          !savingNewSessions && (
                            <Diskette
                              weight="BoldDuotone"
                              className="w-5 h-5"
                            />
                          )
                        }
                      >
                        {t("tutorDashboard.createCourse.saveNewSessions")}
                      </Button>
                    )}
                </>
              )}
            </>
          )}

          <Divider />
          <div className="flex justify-between gap-4">
            <Button
              variant="flat"
              size="lg"
              onPress={() => goBackToStep(2)}
              startContent={
                <AltArrowLeft weight="BoldDuotone" className="w-5 h-5" />
              }
              style={{ color: colors.text.secondary }}
            >
              {t("tutorDashboard.createCourse.back")}
            </Button>
            <Button
              color="primary"
              size="lg"
              onPress={handleCreateSessions}
              isLoading={loading}
              isDisabled={loading}
              style={{
                backgroundColor: colors.primary.main,
                color: colors.text.white,
              }}
              endContent={
                !loading && (
                  <AltArrowRight weight="BoldDuotone" className="w-5 h-5" />
                )
              }
            >
              {loading
                ? t("tutorDashboard.createCourse.creating")
                : t("tutorDashboard.createCourse.nextAddResources")}
            </Button>
          </div>
        </motion.div>
      )}

      {/* STEP 4: Resources per Session */}
      {step === 4 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {Object.values(createdSessions).flat().length === 0 ? (
            <Alert
              color="warning"
              variant="flat"
              title={t("tutorDashboard.createCourse.noSessionsForResources")}
            />
          ) : (
            <>
              {/* Session tabs grouped by module */}
              <Card
                shadow="none"
                style={{ backgroundColor: colors.background.light }}
              >
                <CardBody className="p-4 space-y-4">
                  <h3
                    className="text-sm font-semibold"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("tutorDashboard.createCourse.selectSession")}
                  </h3>
                  {createdModules.map((mod) => {
                    const modSessions = createdSessions[mod.id] || [];
                    if (modSessions.length === 0) return null;
                    return (
                      <div key={mod.id} className="space-y-2">
                        <p
                          className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: colors.text.tertiary }}
                        >
                          {mod.title}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {modSessions.map((sess) => (
                            <Chip
                              key={sess.id}
                              variant={
                                activeSessionForResources === sess.id
                                  ? "solid"
                                  : "flat"
                              }
                              className="cursor-pointer"
                              style={{
                                backgroundColor:
                                  activeSessionForResources === sess.id
                                    ? colors.primary.main
                                    : colors.background.gray,
                                color:
                                  activeSessionForResources === sess.id
                                    ? colors.text.white
                                    : colors.text.primary,
                              }}
                              onClick={() => {
                                setActiveSessionForResources(sess.id);
                                setResourceSearch("");
                                loadExistingResources(sess.id);
                              }}
                            >
                              {sess.title}
                            </Chip>
                          ))}
                        </div>
                        {mod !==
                          createdModules
                            .filter(
                              (m) => (createdSessions[m.id] || []).length > 0,
                            )
                            .at(-1) && (
                          <Divider
                            className="my-1"
                            style={{ backgroundColor: colors.border.light }}
                          />
                        )}
                      </div>
                    );
                  })}
                </CardBody>
              </Card>

              {activeSessionForResources && (
                <>
                  {/* ===== REUSE EXISTING RESOURCES ===== */}
                  <ExistingItemPicker
                    title={t("tutorDashboard.createCourse.existingResources")}
                    description={t(
                      "tutorDashboard.createCourse.existingResourcesDesc",
                    )}
                    items={existingResources.map((r) => ({
                      ...r,
                      description: r.resourceType,
                    }))}
                    selectedIds={
                      selectedExistingResources[activeSessionForResources] || []
                    }
                    onToggle={(id) =>
                      setSelectedExistingResources((prev) => {
                        const current = prev[activeSessionForResources] || [];
                        return {
                          ...prev,
                          [activeSessionForResources]: current.includes(id)
                            ? current.filter((x) => x !== id)
                            : [...current, id],
                        };
                      })
                    }
                    searchValue={resourceSearch}
                    onSearchChange={setResourceSearch}
                    loadingItems={loadingExistingResources}
                    searchPlaceholder={t(
                      "tutorDashboard.createCourse.searchResources",
                    )}
                    onViewDetail={(id) => handleViewResourceDetail(id)}
                  />

                  {/* New resources for active session */}
                  {getResourcesForSession(activeSessionForResources).map(
                    (res, index) => {
                      const resKey = `${activeSessionForResources}|${index}`;
                      const isExisting = !!res.id;
                      const isEditingRes = editingResourceKey === resKey;
                      const isLocked = isExisting && !isEditingRes;
                      return (
                        <Card
                          key={index}
                          shadow="none"
                          style={{ backgroundColor: colors.background.light }}
                        >
                          <CardBody className="space-y-4 p-6">
                            <div className="flex items-center justify-between">
                              <h3
                                className="text-base font-semibold"
                                style={{ color: colors.text.primary }}
                              >
                                {t(
                                  "tutorDashboard.createCourse.resourceNumber",
                                  { number: index + 1 },
                                )}
                              </h3>
                              <div className="flex items-center gap-1">
                                {isExisting && !isEditingRes && (
                                  <Button
                                    isIconOnly
                                    variant="light"
                                    color="danger"
                                    size="sm"
                                    isLoading={
                                      deletingResourceKey ===
                                      `${activeSessionForResources}|${index}`
                                    }
                                    onPress={() =>
                                      setDeleteConfirm({
                                        type: "sessionResource",
                                        sessionId: activeSessionForResources,
                                        resourceId: res.id,
                                        index,
                                      })
                                    }
                                  >
                                    <TrashBinMinimalistic
                                      weight="BoldDuotone"
                                      className="w-4 h-4"
                                    />
                                  </Button>
                                )}
                                {isEditingRes && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="flat"
                                      color="danger"
                                      onPress={cancelEditResource}
                                      startContent={
                                        <CloseSquare
                                          weight="BoldDuotone"
                                          className="w-4 h-4"
                                        />
                                      }
                                    >
                                      {t("tutorDashboard.createCourse.cancel")}
                                    </Button>
                                    <Button
                                      size="sm"
                                      color="primary"
                                      onPress={() =>
                                        saveEditResource(
                                          activeSessionForResources,
                                          index,
                                        )
                                      }
                                      isLoading={savingResource}
                                      startContent={
                                        !savingResource && (
                                          <Diskette
                                            weight="BoldDuotone"
                                            className="w-4 h-4"
                                          />
                                        )
                                      }
                                    >
                                      {t(
                                        "tutorDashboard.createCourse.saveItem",
                                      )}
                                    </Button>
                                  </>
                                )}
                                {!isExisting && (
                                  <Button
                                    isIconOnly
                                    variant="light"
                                    color="danger"
                                    size="sm"
                                    onPress={() =>
                                      removeResource(
                                        activeSessionForResources,
                                        index,
                                      )
                                    }
                                  >
                                    <TrashBinMinimalistic
                                      weight="BoldDuotone"
                                      className="w-4 h-4"
                                    />
                                  </Button>
                                )}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <Input
                                label={t(
                                  "tutorDashboard.createCourse.resourceTitle",
                                )}
                                placeholder={t(
                                  "tutorDashboard.createCourse.resourceTitlePlaceholder",
                                )}
                                labelPlacement="outside"
                                value={res.title}
                                onChange={(e) =>
                                  handleResourceChange(
                                    activeSessionForResources,
                                    index,
                                    "title",
                                    e.target.value,
                                  )
                                }
                                classNames={inputClassNames}
                                isRequired
                                isDisabled={isLocked}
                              />
                              <Select
                                label={t(
                                  "tutorDashboard.createCourse.resourceType",
                                )}
                                labelPlacement="outside"
                                placeholder={t(
                                  "tutorDashboard.createCourse.resourceTypePlaceholder",
                                )}
                                selectedKeys={
                                  res.resourceType ? [res.resourceType] : []
                                }
                                onSelectionChange={(keys) =>
                                  handleResourceChange(
                                    activeSessionForResources,
                                    index,
                                    "resourceType",
                                    [...keys][0] || "",
                                  )
                                }
                                classNames={selectClassNames}
                                isDisabled={isLocked}
                              >
                                {[
                                  "Document",
                                  "Video",
                                  "Slide",
                                  "Audio",
                                  "Homework",
                                  "Exercise",
                                  "PracticeExam",
                                  "Reference",
                                  "Other",
                                ].map((type) => (
                                  <SelectItem key={type}>{type}</SelectItem>
                                ))}
                              </Select>
                            </div>
                            <div>
                              <p
                                className="text-sm font-medium mb-2"
                                style={{ color: colors.text.primary }}
                              >
                                {t("tutorDashboard.createCourse.resourceFile")}
                              </p>
                              <label
                                className={`flex items-center gap-3 p-3 rounded-xl border-2 border-dashed ${isLocked ? "cursor-default opacity-70" : "cursor-pointer"}`}
                                style={{ borderColor: colors.border.light }}
                              >
                                <File
                                  weight="BoldDuotone"
                                  className="w-5 h-5"
                                  style={{ color: colors.text.tertiary }}
                                />
                                <span
                                  className="text-sm flex-1 min-w-0 truncate"
                                  style={{ color: colors.text.secondary }}
                                >
                                  {res.file
                                    ? res.file.name
                                    : res.id && res.url
                                      ? normalizeResourceUrl(res.url)
                                          .split("/")
                                          .pop()
                                          .split("?")[0] || res.url
                                      : t(
                                          "tutorDashboard.createCourse.noFileChosen",
                                        )}
                                </span>
                                {res.id && res.url ? (
                                  <a
                                    href={normalizeResourceUrl(res.url)}
                                    target="_blank"
                                    rel="noreferrer"
                                    title={t("courses.detail.resources.open")}
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex-shrink-0"
                                  >
                                    <SquareAltArrowRight
                                      weight="BoldDuotone"
                                      size={16}
                                      style={{ color: colors.primary.main }}
                                    />
                                  </a>
                                ) : null}
                                {!isLocked && (
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={(e) =>
                                      handleResourceChange(
                                        activeSessionForResources,
                                        index,
                                        "file",
                                        e.target.files?.[0] || null,
                                      )
                                    }
                                  />
                                )}
                              </label>
                            </div>
                          </CardBody>
                        </Card>
                      );
                    },
                  )}

                  <Button
                    variant="flat"
                    startContent={
                      <AddCircle weight="BoldDuotone" className="w-5 h-5" />
                    }
                    onPress={() => addResource(activeSessionForResources)}
                    className="w-full"
                    style={{
                      backgroundColor: colors.background.primaryLight,
                      color: colors.primary.main,
                    }}
                  >
                    {t("tutorDashboard.createCourse.addResource")}
                  </Button>

                  {/* ===== SAVE NEW RESOURCES BUTTON (edit mode) ===== */}
                  {Object.keys(createdResources).length > 0 &&
                    ((resources[activeSessionForResources] || []).some(
                      (r) => !r.id && r.title.trim(),
                    ) ||
                      (
                        selectedExistingResources[activeSessionForResources] ||
                        []
                      ).length > 0) && (
                      <Button
                        color="success"
                        size="lg"
                        className="w-full text-white"
                        onPress={handleSaveNewResources}
                        isLoading={savingNewResources}
                        isDisabled={savingNewResources}
                        startContent={
                          !savingNewResources && (
                            <Diskette
                              weight="BoldDuotone"
                              className="w-5 h-5"
                            />
                          )
                        }
                      >
                        {t("tutorDashboard.createCourse.saveNewResources")}
                      </Button>
                    )}
                </>
              )}
            </>
          )}

          <Divider />
          <div className="flex justify-between gap-4">
            <Button
              variant="flat"
              size="lg"
              onPress={() => goBackToStep(3)}
              startContent={
                <AltArrowLeft weight="BoldDuotone" className="w-5 h-5" />
              }
              style={{ color: colors.text.secondary }}
            >
              {t("tutorDashboard.createCourse.back")}
            </Button>
            <Button
              color="primary"
              size="lg"
              onPress={handleCreateResources}
              isLoading={loading}
              isDisabled={loading}
              style={{
                backgroundColor: colors.primary.main,
                color: colors.text.white,
              }}
              endContent={
                !loading && (
                  <AltArrowRight weight="BoldDuotone" className="w-5 h-5" />
                )
              }
            >
              {loading
                ? Object.keys(createdResources).length > 0
                  ? t("tutorDashboard.createCourse.saving")
                  : t("tutorDashboard.createCourse.creating")
                : t("tutorDashboard.createCourse.nextReview")}
            </Button>
          </div>
        </motion.div>
      )}

      {/* STEP 5: Review & Submit */}
      {step === 5 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          <Card
            shadow="none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-6 space-y-4">
              <h2
                className="text-lg font-semibold"
                style={{ color: colors.text.primary }}
              >
                {t("tutorDashboard.createCourse.reviewTitle")}
              </h2>
              <p className="text-sm" style={{ color: colors.text.secondary }}>
                {t("tutorDashboard.createCourse.reviewSubtitle")}
              </p>
            </CardBody>
          </Card>

          {/* Course info summary */}
          <Card
            shadow="none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-6 space-y-3">
              <h3
                className="text-base font-semibold"
                style={{ color: colors.text.primary }}
              >
                {t("tutorDashboard.createCourse.reviewCourseInfo")}
              </h3>
              <Divider />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span style={{ color: colors.text.secondary }}>
                    {t("tutorDashboard.createCourse.courseTitle")}:
                  </span>
                  <p
                    className="font-medium"
                    style={{ color: colors.text.primary }}
                  >
                    {courseData.Title}
                  </p>
                </div>
                <div>
                  <span style={{ color: colors.text.secondary }}>
                    {t("tutorDashboard.createCourse.level")}:
                  </span>
                  <p
                    className="font-medium"
                    style={{ color: colors.text.primary }}
                  >
                    {courseData.Level}
                  </p>
                </div>
                <div>
                  <span style={{ color: colors.text.secondary }}>
                    {t("tutorDashboard.createCourse.price")}:
                  </span>
                  <p
                    className="font-medium"
                    style={{ color: colors.text.primary }}
                  >
                    {Number(courseData.Price.replace(/\./g, "")).toLocaleString(
                      "vi-VN",
                    )}{" "}
                    VND
                  </p>
                  {(() => {
                    const totalSessions =
                      Object.values(createdSessions).flat().length;
                    const priceNum =
                      Number(courseData.Price.replace(/\./g, "")) || 0;
                    if (totalSessions > 0 && priceNum > 0) {
                      return (
                        <p
                          className="text-xs mt-0.5"
                          style={{ color: colors.state.success }}
                        >
                          Total:{" "}
                          {(priceNum * totalSessions).toLocaleString("vi-VN")}{" "}
                          VND ({totalSessions} sessions)
                        </p>
                      );
                    }
                    return (
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: colors.text.tertiary }}
                      >
                        Total calculated after sessions are added
                      </p>
                    );
                  })()}
                </div>
              </div>
              {courseData.ShortDescription && (
                <div className="text-sm">
                  <span style={{ color: colors.text.secondary }}>
                    {t("tutorDashboard.createCourse.shortDescription")}:
                  </span>
                  <p style={{ color: colors.text.primary }}>
                    {courseData.ShortDescription}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Modules summary */}
          <Card
            shadow="none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-6 space-y-3">
              <h3
                className="text-base font-semibold"
                style={{ color: colors.text.primary }}
              >
                {t("tutorDashboard.createCourse.reviewModules")} (
                {createdModules.length})
              </h3>
              <Divider />
              {createdModules.map((mod) => {
                const modSessions = createdSessions[mod.id] || [];
                return (
                  <div
                    key={mod.id}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: colors.background.gray }}
                  >
                    <p
                      className="font-medium text-sm"
                      style={{ color: colors.text.primary }}
                    >
                      {mod.moduleNumber}. {mod.title}
                    </p>
                    {mod.description && (
                      <p
                        className="text-xs mt-1"
                        style={{ color: colors.text.secondary }}
                      >
                        {mod.description}
                      </p>
                    )}
                    {modSessions.length > 0 && (
                      <div className="mt-2 ml-4 space-y-1">
                        {modSessions.map((sess) => {
                          const sessResources = createdResources[sess.id] || [];
                          return (
                            <div key={sess.id}>
                              <p
                                className="text-xs font-medium"
                                style={{ color: colors.text.primary }}
                              >
                                {sess.sessionNumber}. {sess.title}
                              </p>
                              {sessResources.length > 0 && (
                                <div className="ml-4 mt-1 space-y-0.5">
                                  {sessResources.map((r) => (
                                    <p
                                      key={r.id}
                                      className="text-xs flex items-center gap-1"
                                      style={{ color: colors.text.secondary }}
                                    >
                                      <File
                                        weight="BoldDuotone"
                                        className="w-3 h-3"
                                      />
                                      {r.title} ({r.resourceType})
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardBody>
          </Card>

          <Divider />
          <div className="flex justify-between gap-4">
            <Button
              variant="flat"
              size="lg"
              onPress={() => goBackToStep(4)}
              startContent={
                <AltArrowLeft weight="BoldDuotone" className="w-5 h-5" />
              }
              style={{ color: colors.text.secondary }}
            >
              {t("tutorDashboard.createCourse.back")}
            </Button>
            <Button
              color="primary"
              size="lg"
              onPress={() => setSubmitConfirm(true)}
              isDisabled={loading}
              style={{
                backgroundColor: colors.primary.main,
                color: colors.text.white,
              }}
              startContent={
                !loading && <Plain weight="BoldDuotone" className="w-5 h-5" />
              }
            >
              {loading
                ? t("tutorDashboard.createCourse.submitting")
                : t("tutorDashboard.createCourse.submitForVerification")}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Version History Modal */}
      <Modal
        isOpen={historyOpen}
        onOpenChange={setHistoryOpen}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <History weight="BoldDuotone" className="w-5 h-5" />
                  <span>
                    {t("tutorDashboard.createCourse.versionHistory.title")}
                  </span>
                </div>
                {historyItemName && (
                  <p
                    className="text-sm font-normal"
                    style={{ color: colors.text.secondary }}
                  >
                    {historyItemName}
                  </p>
                )}
              </ModalHeader>
              <ModalBody>
                {historyLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : !historyData ? (
                  <Alert
                    color="warning"
                    variant="flat"
                    title={t(
                      "tutorDashboard.createCourse.versionHistory.noHistory",
                    )}
                  />
                ) : (
                  <div className="space-y-4">
                    {/* Current version */}
                    <div>
                      <h4
                        className="text-sm font-semibold mb-2"
                        style={{ color: colors.text.primary }}
                      >
                        {t(
                          "tutorDashboard.createCourse.versionHistory.currentVersion",
                        )}
                      </h4>
                      <Card
                        shadow="none"
                        style={{
                          backgroundColor: colors.background.light,
                          borderLeft: `3px solid ${colors.primary.main}`,
                        }}
                      >
                        <CardBody className="p-4 space-y-1">
                          <p
                            className="font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {historyType === "module"
                              ? historyData.module?.title
                              : historyData.session?.title}
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: colors.text.secondary }}
                          >
                            {historyType === "module"
                              ? historyData.module?.description
                              : historyData.session?.description}
                          </p>
                          {(historyType === "module"
                            ? historyData.module?.outcomes
                            : historyData.session?.outcomes) && (
                            <p
                              className="text-xs"
                              style={{
                                color: colors.text.tertiary,
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {historyType === "module"
                                ? historyData.module?.outcomes
                                : historyData.session?.outcomes}
                            </p>
                          )}
                        </CardBody>
                      </Card>
                    </div>

                    {/* Previous versions (parentChain) */}
                    {historyData.parentChain &&
                      historyData.parentChain.length > 0 && (
                        <div>
                          <h4
                            className="text-sm font-semibold mb-2"
                            style={{ color: colors.text.primary }}
                          >
                            {t(
                              "tutorDashboard.createCourse.versionHistory.previousVersions",
                            )}
                          </h4>
                          <div className="space-y-3">
                            {historyData.parentChain.map((version, idx) => (
                              <Card
                                key={version.id || idx}
                                shadow="none"
                                style={{
                                  backgroundColor: colors.background.light,
                                  borderLeft: `3px solid ${colors.border.main}`,
                                }}
                              >
                                <CardBody className="p-4">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 space-y-1">
                                      <p
                                        className="font-medium"
                                        style={{ color: colors.text.primary }}
                                      >
                                        {version.title}
                                      </p>
                                      <p
                                        className="text-sm"
                                        style={{
                                          color: colors.text.secondary,
                                        }}
                                      >
                                        {version.description}
                                      </p>
                                      {version.outcomes && (
                                        <p
                                          className="text-xs"
                                          style={{
                                            color: colors.text.tertiary,
                                            whiteSpace: "pre-wrap",
                                          }}
                                        >
                                          {version.outcomes}
                                        </p>
                                      )}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="flat"
                                      startContent={
                                        <Restart
                                          weight="BoldDuotone"
                                          className="w-4 h-4"
                                        />
                                      }
                                      onPress={() => {
                                        if (historyType === "module") {
                                          handleRevertModule(version);
                                        } else {
                                          handleRevertSession(
                                            activeModuleForSessions,
                                            version,
                                          );
                                        }
                                      }}
                                      style={{
                                        color: colors.primary.main,
                                      }}
                                    >
                                      {t(
                                        "tutorDashboard.createCourse.versionHistory.revert",
                                      )}
                                    </Button>
                                  </div>
                                </CardBody>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                    {(!historyData.parentChain ||
                      historyData.parentChain.length === 0) && (
                      <Alert
                        color="default"
                        variant="flat"
                        title={t(
                          "tutorDashboard.createCourse.versionHistory.noPreviousVersions",
                        )}
                      />
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("tutorDashboard.createCourse.versionHistory.close")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Submit for Verification Confirmation Modal */}
      <Modal
        isOpen={submitConfirm}
        onOpenChange={(open) => {
          if (!open) setSubmitConfirm(false);
        }}
        size="sm"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("tutorDashboard.createCourse.confirmSubmitTitle")}
              </ModalHeader>
              <ModalBody>
                <p style={{ color: colors.text.secondary }}>
                  {t("tutorDashboard.createCourse.confirmSubmitMessage")}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={onClose}>
                  {t("tutorDashboard.createCourse.cancel")}
                </Button>
                <Button
                  isLoading={loading}
                  onPress={() => {
                    setSubmitConfirm(false);
                    handleSubmitVerification();
                  }}
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                  startContent={
                    !loading && (
                      <Plain weight="BoldDuotone" className="w-4 h-4" />
                    )
                  }
                >
                  {t("tutorDashboard.createCourse.yes")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirm(null);
        }}
        size="sm"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader>
                {t("tutorDashboard.createCourse.confirmDeleteTitle")}
              </ModalHeader>
              <ModalBody>
                <p style={{ color: colors.text.secondary }}>
                  {deleteConfirm?.type === "module" ||
                  deleteConfirm?.type === "createdModule"
                    ? t("tutorDashboard.createCourse.confirmDeleteModule")
                    : deleteConfirm?.type === "sessionResource"
                      ? t("tutorDashboard.createCourse.confirmDeleteResource")
                      : t("tutorDashboard.createCourse.confirmDeleteSession")}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("tutorDashboard.createCourse.cancel")}
                </Button>
                <Button
                  color="danger"
                  onPress={() => {
                    if (deleteConfirm?.type === "module") {
                      removeModule(deleteConfirm.index);
                    } else if (deleteConfirm?.type === "session") {
                      removeSession(
                        deleteConfirm.moduleId,
                        deleteConfirm.index,
                      );
                    } else if (deleteConfirm?.type === "createdModule") {
                      handleDeleteCreatedModule(deleteConfirm.moduleId);
                    } else if (deleteConfirm?.type === "createdSession") {
                      handleDeleteCreatedSession(
                        deleteConfirm.moduleId,
                        deleteConfirm.sessionId,
                      );
                    } else if (deleteConfirm?.type === "sessionResource") {
                      handleDeleteSessionResource(
                        deleteConfirm.sessionId,
                        deleteConfirm.resourceId,
                        deleteConfirm.index,
                      );
                    }
                    setDeleteConfirm(null);
                  }}
                >
                  {t("tutorDashboard.createCourse.delete")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Resource Detail Modal */}
      <Modal
        isOpen={resourceDetailOpen}
        onOpenChange={(open) => {
          if (!open) setResourceDetailOpen(false);
        }}
        size="lg"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader>
                {t("tutorDashboard.createCourse.resourceDetail")}
              </ModalHeader>
              <ModalBody>
                {resourceDetailLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : resourceDetailData ? (
                  <div className="flex flex-col gap-4">
                    <div>
                      <p
                        className="text-sm font-semibold mb-1"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("tutorDashboard.createCourse.resourceTitle")}
                      </p>
                      <p style={{ color: colors.text.primary }}>
                        {resourceDetailData.title}
                      </p>
                    </div>
                    {resourceDetailData.resourceType && (
                      <div>
                        <p
                          className="text-sm font-semibold mb-1"
                          style={{ color: colors.text.secondary }}
                        >
                          {t("tutorDashboard.createCourse.resourceType")}
                        </p>
                        <p style={{ color: colors.text.primary }}>
                          {resourceDetailData.resourceType}
                        </p>
                      </div>
                    )}
                    {resourceDetailData.url && (
                      <div>
                        <p
                          className="text-sm font-semibold mb-1"
                          style={{ color: colors.text.secondary }}
                        >
                          {t("tutorDashboard.createCourse.resourceFile")}
                        </p>
                        <a
                          href={normalizeResourceUrl(resourceDetailData.url)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-sm"
                          style={{ color: colors.primary.main }}
                        >
                          <SquareAltArrowRight weight="BoldDuotone" size={16} />
                          <span className="break-all">
                            {normalizeResourceUrl(resourceDetailData.url)}
                          </span>
                        </a>
                      </div>
                    )}
                  </div>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("tutorDashboard.createCourse.close")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Module Detail Modal */}
      <Modal
        isOpen={detailOpen}
        onOpenChange={(open) => {
          if (!open) setDetailOpen(false);
        }}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader>
                {t("tutorDashboard.createCourse.moduleDetail")}
              </ModalHeader>
              <ModalBody>
                {detailLoading ? (
                  <div className="flex justify-center py-8">
                    <Spinner />
                  </div>
                ) : detailData ? (
                  <div className="flex flex-col gap-4">
                    <div>
                      <p
                        className="text-sm font-semibold mb-1"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("tutorDashboard.createCourse.moduleTitle")}
                      </p>
                      <p style={{ color: colors.text.primary }}>
                        {detailData.title}
                      </p>
                    </div>

                    {detailData.description && (
                      <div>
                        <p
                          className="text-sm font-semibold mb-1"
                          style={{ color: colors.text.secondary }}
                        >
                          {t("tutorDashboard.createCourse.moduleDescription")}
                        </p>
                        <p style={{ color: colors.text.primary }}>
                          {detailData.description}
                        </p>
                      </div>
                    )}

                    {detailData.outcomes && (
                      <div>
                        <p
                          className="text-sm font-semibold mb-1"
                          style={{ color: colors.text.secondary }}
                        >
                          {t("tutorDashboard.createCourse.outcomes")}
                        </p>
                        <p
                          style={{
                            color: colors.text.primary,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {detailData.outcomes}
                        </p>
                      </div>
                    )}

                    <Divider />

                    <div>
                      <p
                        className="text-sm font-semibold mb-2"
                        style={{ color: colors.text.secondary }}
                      >
                        {t("tutorDashboard.createCourse.sessions")} (
                        {detailData.courseSessions?.length || 0})
                      </p>
                      {detailData.courseSessions?.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {[...detailData.courseSessions]
                            .sort(
                              (a, b) =>
                                (a.sessionNumber || 0) - (b.sessionNumber || 0),
                            )
                            .map((session, idx) => (
                              <Card
                                key={idx}
                                shadow="none"
                                style={{
                                  backgroundColor: colors.background.input,
                                  border: `1px solid ${colors.border.light}`,
                                }}
                              >
                                <CardBody className="gap-1">
                                  <p
                                    className="font-medium"
                                    style={{ color: colors.text.primary }}
                                  >
                                    {session.sessionNumber || idx + 1}.{" "}
                                    {session.sessionTitle}
                                  </p>
                                  {session.sessionDescription && (
                                    <p
                                      className="text-sm"
                                      style={{ color: colors.text.secondary }}
                                    >
                                      {session.sessionDescription}
                                    </p>
                                  )}
                                  {session.sessionOutcomes && (
                                    <p
                                      className="text-xs mt-1"
                                      style={{
                                        color: colors.text.tertiary,
                                        whiteSpace: "pre-wrap",
                                      }}
                                    >
                                      {t(
                                        "tutorDashboard.createCourse.outcomes",
                                      )}
                                      : {session.sessionOutcomes}
                                    </p>
                                  )}
                                </CardBody>
                              </Card>
                            ))}
                        </div>
                      ) : (
                        <p
                          className="text-sm"
                          style={{ color: colors.text.tertiary }}
                        >
                          {t("tutorDashboard.createCourse.noSessions")}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  {t("tutorDashboard.createCourse.close")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CreateCourse;
