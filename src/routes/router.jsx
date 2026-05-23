import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import GuestRoute from "./GuestRoute";
import AdminRoute from "./AdminRoute";
import NonAdminRoute from "./NonAdminRoute";
import TutorRoute from "./TutorRoute";
import RequireTutorRoute from "./RequireTutorRoute";
import RequireAuthRoute from "./RequireAuthRoute";
import DashboardLayout from "../layouts/DashboardLayout";
import TutorDashboardLayout from "../layouts/TutorDashboardLayout";
import AdminDashboardLayout from "../layouts/AdminDashboardLayout";
import Home from "../pages/Home/Home";
import Login from "../pages/Authentication/Login/Login";
import Register from "../pages/Authentication/Register/Register";
import ForgotPass from "../pages/Authentication/ForgotPass/ForgotPass";
import ResetPassword from "../pages/Authentication/ResetPassword/ResetPassword";
import VerifyEmail from "../pages/Authentication/VerifyEmail/VerifyEmail";
import GoogleAuthVerify from "../pages/Authentication/GoogleAuthVerify/GoogleAuthVerify";
import LoginFailed from "../pages/Authentication/LoginFailed/LoginFailed";
import About from "../pages/AboutUs/About";
import Courses from "../pages/Courses/Courses";
import CourseDetail from "../pages/Courses/CourseDetail";
import TutorProfilePage from "../pages/Courses/TutorProfile";
import Checkout from "../pages/Courses/Checkout";
import PaymentReturn from "../pages/Courses/PaymentReturn";
import BecomeTutor from "../pages/BecomeTutor/BecomeTutor";
import TutorRegistration from "../pages/BecomeTutor/TutorRegistration";
import TutorOnboarding from "../pages/TutorDashboard/Onboarding/TutorOnboarding";

// Student Dashboard Pages
import Dashboard from "../pages/StudentDashboard/Dashboard/Dashboard";
import StudentCourseDetail from "../pages/StudentDashboard/MyCourses/CourseDetail";
import MyCourses from "../pages/StudentDashboard/MyCourses/MyCourses";
import Schedule from "../pages/StudentDashboard/Schedule/Schedule";
import Profile from "../pages/StudentDashboard/Profile/Profile";
import Notification from "../pages/StudentDashboard/Notification/Notification";

// Tutor Dashboard Pages
import TutorDashboard from "../pages/TutorDashboard/Dashboard/Dashboard";
import TutorMyCourses from "../pages/TutorDashboard/MyCourses/MyCourses";
import TutorCourseDetail from "../pages/TutorDashboard/MyCourses/CourseDetail";
import TutorSchedule from "../pages/TutorDashboard/Schedule/Schedule";
import TutorStudents from "../pages/TutorDashboard/Students/Students";
import TutorEarnings from "../pages/TutorDashboard/Earnings/Earnings";
import TutorProfile from "../pages/TutorDashboard/Profile/Profile";
import TutorNotification from "../pages/TutorDashboard/Notification/Notification";
import TutorCreateCourse from "../pages/TutorDashboard/CreateCourse/CreateCourse";
import StudentDetail from "../pages/TutorDashboard/Students/StudentDetail";

// Admin Dashboard Pages
import AdminDashboard from "../pages/AdminDashboard/Dashboard/Dashboard";
import AdminStudents from "../pages/AdminDashboard/StudentManagement/StudentManagement";
import AdminStudentDetail from "../pages/AdminDashboard/StudentManagement/StudentDetail";
import AdminTutors from "../pages/AdminDashboard/TutorManagament/TutorManagement";
import AdminVerification from "../pages/AdminDashboard/TutorManagament/TutorVerification";
import AdminCourses from "../pages/AdminDashboard/CourseManagement/CourseManagement";
import AdminCourseVerification from "../pages/AdminDashboard/CourseManagement/CourseVerification";
import AdminCategories from "../pages/AdminDashboard/CourseManagement/CategoryManagement";
import AdminFinance from "../pages/AdminDashboard/FinancialManagement/FinancialManagement";
import AdminCommission from "../pages/AdminDashboard/FinancialManagement/Commission";
import AdminPayroll from "../pages/AdminDashboard/PayrollManagement/PayrollManagement";
import AdminSupportTickets from "../pages/AdminDashboard/SupportTickets/SupportTickets";
import AdminScheduleManagement from "../pages/AdminDashboard/ScheduleManagement/ScheduleManagement";
import AdminLessonReport from "../pages/AdminDashboard/LessonReport/LessonReport";
import AdminHomeworkDetail from "../pages/AdminDashboard/HomeworkDetail/HomeworkDetail";
import AdminCourseDetail from "../pages/AdminDashboard/CourseManagement/CourseDetail";
import AdminCourseVerificationDetail from "../pages/AdminDashboard/CourseManagement/CourseVerificationDetail";
import AdminTutorDetail from "../pages/AdminDashboard/TutorManagament/TutorDetail";

// Help & Support (shared by student/tutor)
import HelpSupport from "../pages/HelpSupport/HelpSupport";

// Video Call
import VideoCall from "../pages/VideoCall/VideoCall";

// Not Found Page
import NotFound from "../pages/NotFound/NotFound";
import Test from "../pages/Test/test";
import TutorHomework from "../pages/TutorDashboard/Homework/Homework";
import TutorCreateHomework from "../pages/TutorDashboard/Homework/CreateHomework";
import StudentHomework from "../pages/StudentDashboard/Homework/Homework";
import StudentOrders from "../pages/StudentDashboard/Orders/Orders";
import HomeworkDetail from "../pages/HomeworkDetail/HomeworkDetail";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <NonAdminRoute>
        <MainLayout />
      </NonAdminRoute>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: "test",
        element: <Test />,
      },
      {
        path: "login",
        element: (
          <GuestRoute>
            <Login />
          </GuestRoute>
        ),
      },
      {
        path: "register",
        element: (
          <GuestRoute>
            <Register />
          </GuestRoute>
        ),
      },
      {
        path: "forgot-password",
        element: (
          <GuestRoute>
            <ForgotPass />
          </GuestRoute>
        ),
      },
      {
        path: "reset-password",
        element: (
          <GuestRoute>
            <ResetPassword />
          </GuestRoute>
        ),
      },
      {
        path: "verify",
        element: (
          <GuestRoute>
            <VerifyEmail />
          </GuestRoute>
        ),
      },
      {
        path: "auth/verify",
        element: <GoogleAuthVerify />,
      },
      {
        path: "auth/login-failed",
        element: <LoginFailed />,
      },
      {
        path: "about",
        element: <About />,
      },
      {
        path: "courses",
        element: <Courses />,
      },
      {
        path: "courses/:id",
        element: <CourseDetail />,
      },
      {
        path: "tutor-profile/:tutorId",
        element: <TutorProfilePage />,
      },
      {
        path: "checkout/:id",
        element: <Checkout />,
      },
      {
        path: "api/payments/payos/return",
        element: <PaymentReturn />,
      },
      {
        path: "become-tutor",
        element: <BecomeTutor />,
      },
      {
        path: "register-tutor",
        element: (
          <TutorRoute>
            <TutorRegistration />
          </TutorRoute>
        ),
      },
      {
        path: "tutor/onboarding",
        element: <TutorOnboarding />,
      },
      {
        path: "help-support",
        element: <HelpSupport />,
      },
    ],
  },
  {
    path: "/student",
    element: (
      <NonAdminRoute>
        <RequireAuthRoute>
          <DashboardLayout />
        </RequireAuthRoute>
      </NonAdminRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "courses/:id",
        element: <StudentCourseDetail />,
      },
      {
        path: "my-courses",
        element: <MyCourses />,
      },
      {
        path: "schedule",
        element: <Schedule />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "homework",
        element: <StudentHomework />,
      },
      {
        path: "homework/:id",
        element: <HomeworkDetail role="student" />,
      },
      {
        path: "orders",
        element: <StudentOrders />,
      },
      {
        path: "notifications",
        element: <Notification />,
      },
    ],
  },
  {
    path: "/tutor",
    element: (
      <NonAdminRoute>
        <RequireTutorRoute>
          <TutorDashboardLayout />
        </RequireTutorRoute>
      </NonAdminRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <TutorDashboard />,
      },
      {
        path: "my-courses",
        element: <TutorMyCourses />,
      },
      {
        path: "courses/:id",
        element: <TutorCourseDetail />,
      },
      {
        path: "create-course",
        element: <TutorCreateCourse />,
      },
      {
        path: "create-course/:courseId",
        element: <TutorCreateCourse />,
      },
      {
        path: "schedule",
        element: <TutorSchedule />,
      },
      {
        path: "students",
        element: <TutorStudents />,
      },
      {
        path: "students/:studentId",
        element: <StudentDetail />,
      },
      {
        path: "earnings",
        element: <TutorEarnings />,
      },
      {
        path: "homework",
        element: <TutorHomework />,
      },
      {
        path: "homework/create",
        element: <TutorCreateHomework />,
      },
      {
        path: "homework/:id",
        element: <HomeworkDetail role="tutor" />,
      },
      {
        path: "profile",
        element: <TutorProfile />,
      },
      {
        path: "notifications",
        element: <TutorNotification />,
      },
    ],
  },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <AdminDashboardLayout />
      </AdminRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <AdminDashboard />,
      },
      {
        path: "students",
        element: <AdminStudents />,
      },
      {
        path: "students/:id",
        element: <AdminStudentDetail />,
      },
      {
        path: "tutors",
        element: <AdminTutors />,
      },
      {
        path: "tutors/:id",
        element: <AdminTutorDetail />,
      },
      {
        path: "verification",
        element: <AdminVerification />,
      },
      {
        path: "courses",
        element: <AdminCourses />,
      },
      {
        path: "courses/:id",
        element: <AdminCourseDetail />,
      },
      {
        path: "course-verification",
        element: <AdminCourseVerification />,
      },
      {
        path: "course-verification/:id",
        element: <AdminCourseVerificationDetail />,
      },
      {
        path: "categories",
        element: <AdminCategories />,
      },
      {
        path: "finance",
        element: <AdminFinance />,
      },
      {
        path: "commission",
        element: <AdminCommission />,
      },
      {
        path: "support-tickets",
        element: <AdminSupportTickets />,
      },
      {
        path: "schedule",
        element: <AdminScheduleManagement />,
      },
      {
        path: "lessons/:id/report",
        element: <AdminLessonReport />,
      },
      {
        path: "homework/:id",
        element: <AdminHomeworkDetail />,
      },
      {
        path: "payroll",
        element: <AdminPayroll />,
      },
    ],
  },
  {
    path: "/meeting/:lessonId",
    element: <VideoCall />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
