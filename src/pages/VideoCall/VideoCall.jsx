import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  AltArrowLeft,
  ChatDots,
  CloseSquare,
  DangerTriangle,
  DownloadMinimalistic,
  FileDownload,
  MenuDots,
  Microphone,
  Muted,
  Paperclip,
  PhoneCalling,
  PresentationGraph,
  Plain,
  SlashCircle,
  Stopwatch,
  UploadMinimalistic,
  UserCircle,
  Videocamera,
  WiFiRouter,
  Translation,
  Dialog,
  Screencast2,
  ShieldCross,
} from "@solar-icons/react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectUser } from "../../store";
import { useTranslation } from "react-i18next";
import { meetingApi, authApi, studentApi } from "../../api";
import useWebRTC from "../../hooks/useWebRTC";
import WhiteboardPanel from "./WhiteboardPanel";
import LessonRatingModal from "../../components/LessonRatingModal/LessonRatingModal";

import conversationIllustration from "../../assets/illustrations/conversation.avif";

// ── File transfer via RTCDataChannel ────────────────────────────────────────
// Backend has no file-upload endpoint — files go P2P over the existing data
// channel using the same 14 KB chunking approach as whiteboard sync.
const FILE_CHUNK = 14_000;
let _fileSeq = 0;

function dataURLtoBlob(dataURL) {
  const [header, b64] = dataURL.split(",");
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(b64);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const VideoCall = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const user = useSelector(selectUser);
  const dateLocale = i18n.language === "vi" ? "vi-VN" : "en-US";

  // meetingInfo + lessonInfo are declared first so userRole can be derived
  const [meetingInfo, setMeetingInfo] = useState(null);
  const [lessonInfo, setLessonInfo] = useState(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Role is derived from the lesson record (tutorId field), NOT from the user
  // profile, so a tutor who purchased another tutor's course joins as Student.
  const userRole = useMemo(() => {
    if (lessonInfo) {
      const myId = String(user?.tutorId || "");
      const tutorId = String(lessonInfo.tutorId || "");
      if (myId && tutorId) return myId === tutorId ? "Tutor" : "Student";
    }
    return user?.tutorId ? "Tutor" : "Student";
  }, [lessonInfo, user]);

  const {
    connectionState,
    meetingStatus,
    participants,
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    screenStream,
    chatMessages,
    error,
    isDataChannelOpen,
    remoteMediaState,
    connect,
    disconnect,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    sendMessage,
    sendData,
    onDataMessage,
    endMeeting,
    leaveRoom,
    setWhiteboardRecording,
  } = useWebRTC(lessonId, userRole);

  const [showChat, setShowChat] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [joined, setJoined] = useState(false);
  const [userNames, setUserNames] = useState({});
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState(null); // null | "leave" | "end"
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingDismissed, setRatingDismissed] = useState(false);

  const [localFileMessages, setLocalFileMessages] = useState([]);
  // { id, name, size, mimeType, url, isMe, sentAt }

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const chatEndRef = useRef(null);
  const fetchingNamesRef = useRef(new Set());
  const elapsedTimerRef = useRef(null);
  const whiteboardCaptureRef = useRef(null);
  const pendingFileChunksRef = useRef({});
  const fileInputRef = useRef(null);

  // Create off-DOM capture canvas for whiteboard recording (1280x720 fixed size)
  useEffect(() => {
    const c = document.createElement("canvas");
    c.width = 1280;
    c.height = 720;
    whiteboardCaptureRef.current = c;
    return () => {
      whiteboardCaptureRef.current = null;
    };
  }, []);

  // Switch recording source when whiteboard opens/closes
  useEffect(() => {
    if (showWhiteboard) {
      setWhiteboardRecording(whiteboardCaptureRef.current);
    } else {
      setWhiteboardRecording(null);
    }
  }, [showWhiteboard, setWhiteboardRecording]);

  // Fetch display name for a userId and cache it
  const fetchUserName = useCallback(
    async (userId) => {
      if (!userId || userNames[userId] || fetchingNamesRef.current.has(userId))
        return;
      fetchingNamesRef.current.add(userId);
      try {
        const res = await authApi.getUserById(userId);
        const u = res.data;
        const name =
          `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.userName;
        setUserNames((prev) => ({ ...prev, [userId]: name }));
      } catch {
        setUserNames((prev) => ({ ...prev, [userId]: "User" }));
      } finally {
        fetchingNamesRef.current.delete(userId);
      }
    },
    [userNames],
  );

  // Resolve names for incoming chat messages
  useEffect(() => {
    chatMessages.forEach((msg) => {
      const isMe = msg.userId === user?.userId || msg.userId === user?.sub;
      if (!isMe) fetchUserName(msg.userId);
    });
  }, [chatMessages, user, fetchUserName]);

  // Fetch meeting + lesson info in parallel; treat 401/403/404 as access denied
  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const [meetingRes, lessonRes] = await Promise.all([
          meetingApi.getMeeting(lessonId),
          studentApi.getLessonById(lessonId),
        ]);
        setMeetingInfo(meetingRes.data || meetingRes);
        setLessonInfo(lessonRes.data || lessonRes);
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401 || status === 403 || status === 404) {
          setAccessDenied(true);
        }
      } finally {
        setLoadingInfo(false);
      }
    };
    fetchInfo();
  }, [lessonId]);

  // Auto-show rating modal once meeting ends (peer-initiated end)
  useEffect(() => {
    if (meetingStatus !== "Ended") return;
    if (userRole !== "Student") return;
    if (ratingDismissed || showRatingModal) return;
    if (!lessonInfo) return;
    const alreadyRated = (lessonInfo.lessonRatings || []).length > 0;
    if (alreadyRated) return;
    setShowRatingModal(true);
  }, [meetingStatus, userRole, lessonInfo, ratingDismissed, showRatingModal]);

  // Elapsed timer: starts when connected + joined
  useEffect(() => {
    if (joined && connectionState === "connected") {
      setElapsedSeconds(0);
      elapsedTimerRef.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    }
    return () => {
      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
      }
    };
  }, [joined, connectionState]);

  // Attach local stream — re-run when whiteboard is toggled (new DOM element)
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, showWhiteboard]);

  // Attach remote stream — re-run when whiteboard is toggled
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream, showWhiteboard]);

  // Attach screen share stream
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, localFileMessages]);

  // Merge SignalR text messages + P2P file messages, sorted by time
  const allMessages = useMemo(() => {
    const texts = chatMessages.map((m) => ({ ...m, isFile: false }));
    const files = localFileMessages.map((m) => ({ ...m, isFile: true }));
    return [...texts, ...files].sort(
      (a, b) => new Date(a.sentAt) - new Date(b.sentAt),
    );
  }, [chatMessages, localFileMessages]);

  // Ref holding the whiteboard's own message handler (set by WhiteboardPanel via onWbMessage prop).
  // Using a ref avoids re-registering the master router when the whiteboard mounts/unmounts.
  const wbMessageHandlerRef = useRef(null);

  // Stable callback passed to WhiteboardPanel instead of raw onDataMessage.
  // WhiteboardSync calls this to register/unregister its handler without
  // touching the master router subscription.
  const registerWbHandler = useCallback((handler) => {
    wbMessageHandlerRef.current = handler;
    return () => {
      wbMessageHandlerRef.current = null;
    };
  }, []);

  // ── Single unified data-channel router ────────────────────────────────────
  // Only ONE onDataMessage subscription exists at all times.  All message types
  // are dispatched here so none can silently overwrite another handler.
  useEffect(() => {
    const unsub = onDataMessage((rawData) => {
      try {
        const msg = JSON.parse(rawData);

        // wb:open — each side opens their board independently; no forced sync.
        if (msg.type === "wb:open") return;

        // wb:close — only the tutor's close forces the student to close too.
        if (msg.type === "wb:close") {
          if (msg.fromTutor) setShowWhiteboard(false);
          return;
        }

        // file:chunk — P2P file reassembly
        if (msg.type === "file:chunk") {
          const { id, i, n, d } = msg;
          if (!pendingFileChunksRef.current[id]) {
            pendingFileChunksRef.current[id] = {
              parts: new Array(n).fill(null),
              got: 0,
              n,
            };
          }
          const entry = pendingFileChunksRef.current[id];
          if (entry.parts[i] === null) {
            entry.parts[i] = d;
            entry.got++;
          }
          if (entry.got === entry.n) {
            const payload = entry.parts.join("");
            delete pendingFileChunksRef.current[id];
            const fileMsg = JSON.parse(payload);
            if (fileMsg.type === "file") {
              const blob = dataURLtoBlob(fileMsg.data);
              const url = URL.createObjectURL(blob);
              setLocalFileMessages((prev) => [
                ...prev,
                {
                  id: fileMsg.id,
                  name: fileMsg.name,
                  size: fileMsg.size,
                  mimeType: fileMsg.mimeType,
                  url,
                  isMe: false,
                  sentAt: new Date().toISOString(),
                },
              ]);
            }
          }
          return;
        }

        // Everything else (wb:*, wb:chunk, wb:req_sync …) → whiteboard handler
        wbMessageHandlerRef.current?.(rawData);
      } catch {
        /* ignore non-JSON or parse errors */
      }
    });
    return () => unsub();
  }, [onDataMessage]); // stable — runs once after mount

  // Revoke blob URLs when component unmounts to avoid memory leaks
  useEffect(() => {
    return () => {
      localFileMessages.forEach((m) => {
        try {
          URL.revokeObjectURL(m.url);
        } catch {
          /* ignore */
        }
      });
    };
    // intentionally empty dep — runs only on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleJoin = useCallback(async () => {
    setJoined(true);
    await connect();
  }, [connect]);

  const handleLeave = useCallback(async () => {
    setConfirmDialog(null);
    await leaveRoom();
    await disconnect();
    navigate(-1);
  }, [leaveRoom, disconnect, navigate]);

  const handleEndMeeting = useCallback(async () => {
    setConfirmDialog(null);
    await endMeeting();
    await disconnect();
    navigate(-1);
  }, [endMeeting, disconnect, navigate]);

  const handleSendChat = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage(chatInput);
      setChatInput("");
    }
  };

  const handleSendFile = useCallback(
    (file) => {
      if (!file || !isDataChannelOpen) return;
      const MAX = 25 * 1024 * 1024; // 25 MB
      if (file.size > MAX) {
        alert("File too large (max 25 MB)");
        return;
      }
      const id = String(++_fileSeq) + Date.now().toString(36);
      const reader = new FileReader();
      reader.onload = () => {
        const payload = JSON.stringify({
          type: "file",
          id,
          name: file.name,
          size: file.size,
          mimeType: file.type || "application/octet-stream",
          data: reader.result,
        });
        const n = Math.ceil(payload.length / FILE_CHUNK);
        for (let i = 0; i < n; i++) {
          const d = payload.slice(i * FILE_CHUNK, (i + 1) * FILE_CHUNK);
          sendData(JSON.stringify({ type: "file:chunk", id, i, n, d }));
        }
        // Show on sender side immediately
        const url = URL.createObjectURL(file);
        setLocalFileMessages((prev) => [
          ...prev,
          {
            id,
            name: file.name,
            size: file.size,
            mimeType: file.type || "application/octet-stream",
            url,
            isMe: true,
            sentAt: new Date().toISOString(),
          },
        ]);
      };
      reader.readAsDataURL(file);
    },
    [isDataChannelOpen, sendData],
  );

  const handleToggleWhiteboard = () => {
    const next = !showWhiteboard;
    setShowWhiteboard(next);
    if (!next && userRole === "Tutor") {
      sendData(JSON.stringify({ type: "wb:close", fromTutor: true }));
    }
  };

  // Format elapsed seconds as MM:SS or H:MM:SS
  const formatElapsed = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0)
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Remote name and session title come from the lesson API (definitive fields)
  const remoteName = lessonInfo
    ? userRole === "Tutor"
      ? `${lessonInfo.studentFirstName || ""} ${lessonInfo.studentLastName || ""}`.trim() ||
        null
      : `${lessonInfo.tutorFirstName || ""} ${lessonInfo.tutorLastName || ""}`.trim() ||
        null
    : null;

  const sessionTitle =
    lessonInfo?.sessionTitle ||
    meetingInfo?.sessionTitle ||
    t("videoCall.title");

  const remoteAudioEnabled = remoteMediaState.isAudioEnabled;
  const remoteVideoEnabled = remoteMediaState.isVideoEnabled;

  // Connection indicator
  const ConnectionBadge = () => {
    const badgeColors = {
      connected: "#22C55E",
      connecting: "#F59E0B",
      reconnecting: "#F59E0B",
      disconnected: "#EF4444",
    };
    const bg = badgeColors[connectionState] || badgeColors.disconnected;
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
        style={{ backgroundColor: bg, color: "white" }}
      >
        {connectionState === "connected" ? (
          <Translation weight="BoldDuotone" className="w-3.5 h-3.5" />
        ) : (
          <ShieldCross weight="BoldDuotone" className="w-3.5 h-3.5" />
        )}
        {t(`videoCall.connection.${connectionState}`)}
      </div>
    );
  };

  // Access denied screen — backend blocked this user from the meeting
  if (accessDenied) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center max-w-sm mx-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <DangerTriangle
              weight="BoldDuotone"
              className="w-9 h-9 text-red-400"
            />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {t("videoCall.accessDenied")}
          </h2>
          <p className="text-gray-400 text-sm mb-6">
            {t("videoCall.accessDeniedDesc")}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-xl bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors"
          >
            {t("videoCall.backToSchedule")}
          </button>
        </div>
      </div>
    );
  }

  // Meeting ended screen
  if (meetingStatus === "Ended") {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="text-center">
          <PhoneCalling
            weight="BoldDuotone"
            className="w-16 h-16 text-red-400 mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-white mb-2">
            {t("videoCall.meetingEnded")}
          </h2>
          <p className="text-gray-400 mb-6">
            {t("videoCall.meetingEndedDesc")}
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-xl bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors"
          >
            {t("videoCall.backToSchedule")}
          </button>
        </div>
        <LessonRatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            setRatingDismissed(true);
          }}
          lesson={lessonInfo}
          onSuccess={() => {
            setShowRatingModal(false);
            setRatingDismissed(true);
          }}
        />
      </div>
    );
  }

  // Pre-join lobby
  if (!joined) {
    return (
      <div className="fixed inset-0 bg-gray-900 flex items-center justify-center z-50">
        <div className="max-w-lg w-full mx-4">
          <div className="text-center mb-8">
            <Videocamera
              weight="BoldDuotone"
              className="w-12 h-12 text-emerald-400 mx-auto mb-3"
            />
            <h1 className="text-2xl font-bold text-white mb-1">
              {sessionTitle}
            </h1>
            <p className="text-gray-400 text-sm">
              {t("videoCall.readyToJoin")}
            </p>
          </div>

          <div className="rounded-2xl bg-gray-800/60 p-6 mb-6 backdrop-blur">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <UserCircle
                  weight="BoldDuotone"
                  className="w-6 h-6 text-emerald-400"
                />
              </div>
              <div>
                <p className="text-white font-medium text-sm">
                  {user?.fullName ||
                    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
                    user?.email ||
                    t("videoCall.you")}
                </p>
                <p className="text-gray-400 text-xs">
                  {userRole === "Tutor"
                    ? t("videoCall.roleTutor")
                    : t("videoCall.roleStudent")}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 text-red-300 text-sm">
                {error}
              </div>
            )}

            <button
              onClick={handleJoin}
              disabled={loadingInfo}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              {loadingInfo ? (
                <MenuDots
                  weight="BoldDuotone"
                  className="w-5 h-5 animate-spin"
                />
              ) : (
                <Videocamera weight="BoldDuotone" className="w-5 h-5" />
              )}
              {t("videoCall.joinMeeting")}
            </button>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 mx-auto text-gray-400 hover:text-white text-sm transition-colors"
          >
            <AltArrowLeft weight="BoldDuotone" className="w-4 h-4" />
            {t("videoCall.backToSchedule")}
          </button>
        </div>
      </div>
    );
  }

  // Main call UI
  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col z-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gray-800/90 backdrop-blur border-b border-gray-700/50 relative">
        {/* Left: connection + title */}
        <div className="flex items-center gap-3 min-w-0">
          <ConnectionBadge />
          <span className="text-white text-sm font-semibold truncate max-w-[200px]">
            {sessionTitle}
          </span>
          {participants.length > 0 && (
            <span className="text-gray-500 text-xs hidden sm:block">
              {participants.length + 1} {t("videoCall.participants")}
            </span>
          )}
        </div>

        {/* Center: elapsed timer */}
        {connectionState === "connected" && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-emerald-400 text-sm font-mono font-medium">
            <Stopwatch weight="BoldDuotone" className="w-4 h-4" />
            {formatElapsed(elapsedSeconds)}
          </div>
        )}

        {/* Right: chat toggle */}
        <button
          onClick={() => setShowChat(!showChat)}
          className={`relative p-2 rounded-xl transition-colors ${showChat ? "bg-emerald-500/20 text-emerald-400" : "text-gray-400 hover:text-white hover:bg-gray-700"}`}
        >
          <Dialog weight="BoldDuotone" className="w-5 h-5" />
        </button>
      </div>

      {/* Content area */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex p-3 gap-3 overflow-hidden">
          {/* ── Whiteboard mode ── */}
          {showWhiteboard ? (
            <>
              {/* Whiteboard panel */}
              <div className="flex-1 rounded-2xl overflow-hidden bg-white">
                <WhiteboardPanel
                  sendData={sendData}
                  onWbMessage={registerWbHandler}
                  isHost={userRole === "Tutor"}
                  isDataChannelOpen={isDataChannelOpen}
                  captureCanvas={whiteboardCaptureRef.current}
                />
              </div>

              {/* Video column: remote + local stacked */}
              <div className="w-44 flex flex-col gap-3 flex-shrink-0">
                {/* Remote video tile */}
                <div className="flex-1 rounded-xl overflow-hidden bg-gray-800 relative">
                  {remoteStream && remoteVideoEnabled ? (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1">
                      <UserCircle
                        weight="BoldDuotone"
                        className="w-10 h-10 text-gray-600"
                      />
                      {remoteName && (
                        <span className="text-gray-500 text-[11px] text-center px-2">
                          {remoteName}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Remote status badges */}
                  {!remoteAudioEnabled && (
                    <div className="absolute top-1.5 left-1.5 bg-red-500 rounded-full p-1">
                      <Muted
                        weight="BoldDuotone"
                        className="w-3 h-3 text-white"
                      />
                    </div>
                  )}
                  {/* Remote name label */}
                  {remoteName && remoteStream && (
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 py-1.5 flex justify-center">
                      <span className="text-[11px] text-white/90 font-medium">
                        {remoteName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Local video tile */}
                <div className="flex-1 rounded-xl overflow-hidden bg-gray-800 relative">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{
                      transform: "scaleX(-1)",
                      display: localStream && isVideoEnabled ? "block" : "none",
                    }}
                  />
                  {!(localStream && isVideoEnabled) && (
                    <div className="w-full h-full flex items-center justify-center bg-gray-800">
                      <UserCircle
                        weight="BoldDuotone"
                        className="w-10 h-10 text-gray-600"
                      />
                    </div>
                  )}
                  {!isAudioEnabled && (
                    <div className="absolute top-1.5 left-1.5 bg-red-500 rounded-full p-1">
                      <Muted
                        weight="BoldDuotone"
                        className="w-3 h-3 text-white"
                      />
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 py-1.5 flex justify-center">
                    <span className="text-[11px] text-white/90 font-medium">
                      {t("videoCall.you")}
                    </span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* ── Normal video mode ── */
            <div className="relative flex-1 h-full rounded-2xl overflow-hidden bg-gray-800">
              {remoteStream ? (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    style={{ display: remoteVideoEnabled ? "block" : "none" }}
                  />
                  {/* Avatar when remote camera is off */}
                  {!remoteVideoEnabled && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-800">
                      <UserCircle
                        weight="BoldDuotone"
                        className="w-24 h-24 text-gray-600"
                      />
                      {remoteName && (
                        <span className="text-gray-300 text-sm font-medium">
                          {remoteName}
                        </span>
                      )}
                    </div>
                  )}
                  {/* Remote status badges (top-right) */}
                  <div className="absolute top-3 right-3 flex gap-1.5">
                    {!remoteAudioEnabled && (
                      <div className="flex items-center gap-1 bg-gray-900/80 backdrop-blur px-2 py-1 rounded-full">
                        <Muted
                          weight="BoldDuotone"
                          className="w-3.5 h-3.5 text-red-400"
                        />
                        <span className="text-[11px] text-red-400 font-medium">
                          {t("videoCall.remoteMuted")}
                        </span>
                      </div>
                    )}
                    {!remoteVideoEnabled && (
                      <div className="flex items-center gap-1 bg-gray-900/80 backdrop-blur px-2 py-1 rounded-full">
                        <Videocamera
                          weight="BoldDuotone"
                          className="w-3.5 h-3.5 text-amber-400"
                        />
                        <span className="text-[11px] text-amber-400 font-medium">
                          {t("videoCall.remoteCameraOff")}
                        </span>
                      </div>
                    )}
                  </div>
                  {/* Remote name overlay (bottom-left) — only when video is on */}
                  {remoteName && remoteVideoEnabled && (
                    <div className="absolute bottom-20 left-4 flex items-center gap-1.5 bg-gray-900/70 backdrop-blur px-3 py-1.5 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-white text-xs font-medium">
                        {remoteName}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                /* Waiting / connecting state */
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  {connectionState === "connecting" ? (
                    <>
                      <MenuDots
                        weight="BoldDuotone"
                        className="w-12 h-12 text-emerald-400 animate-spin mb-4"
                      />
                      <p className="text-gray-400 text-sm">
                        {t("videoCall.connecting")}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="relative flex items-center justify-center mb-6">
                        <div className="absolute w-32 h-32 rounded-full border-2 border-emerald-500/20 animate-ping" />
                        <div className="absolute w-24 h-24 rounded-full border-2 border-emerald-500/30 animate-ping [animation-delay:0.3s]" />
                        <div className="relative w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center">
                          <UserCircle
                            weight="BoldDuotone"
                            className="w-14 h-14 text-gray-500"
                          />
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm font-medium">
                        {remoteName
                          ? t("videoCall.waitingFor", { name: remoteName })
                          : t("videoCall.waitingForOther")}
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Screen share preview */}
              {isScreenSharing && screenStream && (
                <div className="absolute bottom-20 left-4 w-64 h-40 rounded-xl overflow-hidden bg-black shadow-2xl border-2 border-emerald-500/50">
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute top-2 left-2 bg-emerald-500 rounded-full px-2 py-0.5">
                    <span className="text-[10px] text-white font-medium">
                      {t("videoCall.sharing")}
                    </span>
                  </div>
                </div>
              )}

              {/* Local camera PIP */}
              <div className="absolute bottom-4 right-4 w-48 h-36 rounded-xl overflow-hidden bg-gray-900 shadow-2xl border-2 border-gray-600/60">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{
                    transform: "scaleX(-1)",
                    display: localStream && isVideoEnabled ? "block" : "none",
                  }}
                />
                {!(localStream && isVideoEnabled) && (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <UserCircle
                      weight="BoldDuotone"
                      className="w-12 h-12 text-gray-600"
                    />
                  </div>
                )}
                {!isAudioEnabled && (
                  <div className="absolute top-2 left-2 bg-red-500 rounded-full p-1">
                    <Muted
                      weight="BoldDuotone"
                      className="w-3 h-3 text-white"
                    />
                  </div>
                )}
                <div className="absolute bottom-0 inset-x-0 flex justify-center pb-1.5">
                  <span className="text-[11px] text-white/80 font-medium bg-gray-900/60 px-2 py-0.5 rounded-full">
                    {t("videoCall.you")}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Chat panel */}
          {showChat && (
            <div className="w-80 flex flex-col bg-gray-800 rounded-2xl overflow-hidden flex-shrink-0">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
                <h3 className="text-white font-semibold text-sm">
                  {t("videoCall.chat")}
                </h3>
                <button
                  onClick={() => setShowChat(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <CloseSquare weight="BoldDuotone" className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {allMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full opacity-60">
                    <img
                      src={conversationIllustration}
                      alt="No messages"
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      onContextMenu={(e) => e.preventDefault()}
                      className="w-48 h-48 object-contain mb-3"
                    />
                    <p className="text-gray-400 text-xs text-center">
                      {t("videoCall.noMessages")}
                    </p>
                  </div>
                ) : (
                  allMessages.map((msg, idx) => {
                    const isMe = msg.isFile
                      ? msg.isMe
                      : msg.userId === user?.userId || msg.userId === user?.sub;
                    const prevMsg = allMessages[idx - 1];
                    const sameSenderAsPrev =
                      prevMsg &&
                      !prevMsg.isFile &&
                      !msg.isFile &&
                      prevMsg.userId === msg.userId;
                    const isFirst = idx === 0 || !sameSenderAsPrev;
                    const senderName = isMe
                      ? t("videoCall.you")
                      : msg.isFile
                        ? remoteName || "..."
                        : userNames[msg.userId] || "...";
                    const isImage =
                      msg.isFile && msg.mimeType?.startsWith("image/");

                    return (
                      <div
                        key={msg.isFile ? `f-${msg.id}` : idx}
                        className={`flex flex-col ${isMe ? "items-end" : "items-start"} ${!isFirst ? "!mt-0.5" : ""}`}
                      >
                        {isFirst && (
                          <p
                            className={`text-[11px] font-medium mb-1 px-1 ${isMe ? "text-emerald-300" : "text-gray-400"}`}
                          >
                            {senderName}
                          </p>
                        )}

                        {msg.isFile ? (
                          /* ── File message bubble ── */
                          <div
                            className={`max-w-[85%] rounded-2xl overflow-hidden ${isMe ? "rounded-br-md" : "rounded-bl-md"} ${isMe ? "bg-emerald-600" : "bg-gray-700"}`}
                          >
                            {isImage && (
                              <a
                                href={msg.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                download={msg.name}
                              >
                                <img
                                  src={msg.url}
                                  alt={msg.name}
                                  className="max-w-full max-h-48 object-contain block"
                                />
                              </a>
                            )}
                            <div className="flex items-center gap-2 px-3 py-2">
                              {!isImage && (
                                <FileDownload
                                  weight="BoldDuotone"
                                  className="w-5 h-5 shrink-0 text-white/70"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-white text-xs font-medium truncate">
                                  {msg.name}
                                </p>
                                <p
                                  className={`text-[10px] ${isMe ? "text-emerald-200" : "text-gray-400"}`}
                                >
                                  {formatFileSize(msg.size)}
                                </p>
                              </div>
                              <a
                                href={msg.url}
                                download={msg.name}
                                className={`p-1.5 rounded-lg shrink-0 transition-colors ${isMe ? "bg-emerald-500 hover:bg-emerald-400" : "bg-gray-600 hover:bg-gray-500"}`}
                                title="Download"
                              >
                                <DownloadMinimalistic
                                  weight="BoldDuotone"
                                  className="w-3.5 h-3.5 text-white"
                                />
                              </a>
                            </div>
                            <p
                              className={`text-[10px] px-3 pb-1.5 ${isMe ? "text-emerald-200 text-right" : "text-gray-500"}`}
                            >
                              {new Date(msg.sentAt).toLocaleTimeString(
                                dateLocale,
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </p>
                          </div>
                        ) : (
                          /* ── Text message bubble ── */
                          <div
                            className={`max-w-[80%] px-3 py-1.5 text-sm ${isMe ? "bg-emerald-500 text-white rounded-2xl rounded-br-md" : "bg-gray-700 text-gray-200 rounded-2xl rounded-bl-md"}`}
                          >
                            <p className="break-words">{msg.message}</p>
                            <p
                              className={`text-[10px] mt-0.5 ${isMe ? "text-emerald-200 text-right" : "text-gray-500"}`}
                            >
                              {new Date(msg.sentAt).toLocaleTimeString(
                                dateLocale,
                                { hour: "2-digit", minute: "2-digit" },
                              )}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleSendFile(file);
                  e.target.value = "";
                }}
              />

              <form
                onSubmit={handleSendChat}
                className="p-3 border-t border-gray-700"
              >
                <div className="flex gap-2">
                  {/* File attachment button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={!isDataChannelOpen}
                    title={
                      isDataChannelOpen
                        ? t("videoCall.sendFile")
                        : t("videoCall.whiteboardConnecting")
                    }
                    className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0"
                  >
                    <Paperclip weight="BoldDuotone" className="w-4 h-4" />
                  </button>
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={t("videoCall.typeMessage")}
                    maxLength={2000}
                    className="flex-1 bg-gray-700 text-white text-sm rounded-xl px-3 py-2 outline-none placeholder-gray-500 focus:ring-2 focus:ring-emerald-500/50"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="p-2 rounded-xl bg-emerald-500 text-white disabled:opacity-40 hover:bg-emerald-600 transition-colors"
                  >
                    <Plain weight="BoldDuotone" className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="flex items-center justify-center gap-2 px-4 py-4 bg-gray-800/90 backdrop-blur border-t border-gray-700/50">
        {/* Mic */}
        <button
          onClick={toggleAudio}
          className={`flex flex-col items-center gap-1 px-5 py-3 rounded-2xl transition-colors ${
            isAudioEnabled
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          }`}
        >
          {isAudioEnabled ? (
            <Microphone weight="BoldDuotone" className="w-5 h-5" />
          ) : (
            <Muted weight="BoldDuotone" className="w-5 h-5" />
          )}
          <span className="text-[11px] font-medium leading-none">
            {t("videoCall.mic")}
          </span>
        </button>

        {/* Camera */}
        <button
          onClick={toggleVideo}
          className={`flex flex-col items-center gap-1 px-5 py-3 rounded-2xl transition-colors ${
            isVideoEnabled
              ? "bg-gray-700 text-white hover:bg-gray-600"
              : "bg-red-500/20 text-red-400 hover:bg-red-500/30"
          }`}
        >
          {isVideoEnabled ? (
            <Videocamera weight="BoldDuotone" className="w-5 h-5" />
          ) : (
            <Videocamera weight="BoldDuotone" className="w-5 h-5" />
          )}
          <span className="text-[11px] font-medium leading-none">
            {t("videoCall.camera")}
          </span>
        </button>

        {/* Screen share (tutor only, disabled when whiteboard is open) */}
        {userRole === "Tutor" && (
          <button
            onClick={toggleScreenShare}
            disabled={showWhiteboard}
            className={`flex flex-col items-center gap-1 px-5 py-3 rounded-2xl transition-colors ${
              isScreenSharing
                ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                : showWhiteboard
                  ? "bg-gray-700/40 text-gray-600 cursor-not-allowed"
                  : "bg-gray-700 text-white hover:bg-gray-600"
            }`}
          >
            <Screencast2 weight="BoldDuotone" className="w-5 h-5" />
            <span className="text-[11px] font-medium leading-none">
              {t("videoCall.screen")}
            </span>
          </button>
        )}

        {/* Whiteboard (both roles, disabled when screen sharing) */}
        <button
          onClick={handleToggleWhiteboard}
          disabled={isScreenSharing}
          className={`flex flex-col items-center gap-1 px-5 py-3 rounded-2xl transition-colors ${
            showWhiteboard
              ? "bg-violet-500/20 text-violet-400 hover:bg-violet-500/30"
              : isScreenSharing
                ? "bg-gray-700/40 text-gray-600 cursor-not-allowed"
                : "bg-gray-700 text-white hover:bg-gray-600"
          }`}
        >
          <PresentationGraph weight="BoldDuotone" className="w-5 h-5" />
          <span className="text-[11px] font-medium leading-none">
            {t("videoCall.whiteboard")}
            {showWhiteboard && !isDataChannelOpen && (
              <span className="block text-[9px] text-violet-400/70 leading-none mt-0.5">
                {t("videoCall.whiteboardConnecting")}
              </span>
            )}
          </span>
        </button>

        {/* Separator */}
        <div className="w-px h-10 bg-gray-700 mx-1" />

        {/* Leave / End */}
        {userRole === "Tutor" ? (
          <button
            onClick={() => setConfirmDialog("end")}
            className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <PhoneCalling weight="BoldDuotone" className="w-5 h-5" />
            <span className="text-[11px] font-medium leading-none">
              {t("videoCall.endMeeting")}
            </span>
          </button>
        ) : (
          <button
            onClick={() => setConfirmDialog("leave")}
            className="flex flex-col items-center gap-1 px-5 py-3 rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            <PhoneCalling weight="BoldDuotone" className="w-5 h-5" />
            <span className="text-[11px] font-medium leading-none">
              {t("videoCall.leave")}
            </span>
          </button>
        )}
      </div>

      {/* Confirmation dialog overlay */}
      {confirmDialog && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
          <div className="bg-gray-800 rounded-2xl p-6 w-80 shadow-2xl border border-gray-700">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center">
                <DangerTriangle
                  weight="BoldDuotone"
                  className="w-8 h-8 text-red-400"
                />
              </div>
            </div>
            <h3 className="text-white font-bold text-lg text-center mb-2">
              {confirmDialog === "end"
                ? t("videoCall.endConfirmTitle")
                : t("videoCall.leaveConfirmTitle")}
            </h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              {confirmDialog === "end"
                ? t("videoCall.endConfirmDesc")
                : t("videoCall.leaveConfirmDesc")}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDialog(null)}
                className="flex-1 py-2.5 rounded-xl bg-gray-700 text-white text-sm font-medium hover:bg-gray-600 transition-colors"
              >
                {t("videoCall.cancel")}
              </button>
              <button
                onClick={
                  confirmDialog === "end" ? handleEndMeeting : handleLeave
                }
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors"
              >
                {confirmDialog === "end"
                  ? t("videoCall.endConfirmBtn")
                  : t("videoCall.leaveConfirmBtn")}
              </button>
            </div>
          </div>
        </div>
      )}

      <LessonRatingModal
        isOpen={showRatingModal}
        onClose={() => {
          setShowRatingModal(false);
          setRatingDismissed(true);
        }}
        lesson={lessonInfo}
        onSuccess={() => {
          setShowRatingModal(false);
          setRatingDismissed(true);
        }}
      />
    </div>
  );
};

export default VideoCall;
