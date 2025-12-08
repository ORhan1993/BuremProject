import axios from 'axios';
import type { AxiosResponse } from 'axios';

// Backend URL
axios.defaults.baseURL = 'http://localhost:5221/api';

// --- TİP TANIMLARI ---
export interface SiteContent { key: string; value: string; }
export interface QuestionOption { id?: number; optionTitle: string; optionValue: string; sortOrder: number; }
export interface Question { id: number; sortOrder: number; questionTitle: string; questionType: number; questionGroup: number; appForm: number; options: QuestionOption[]; }
export interface CreateQuestionDto { id?: number; sortOrder: number; questionTitle: string; questionType: number; questionGroup: number; options: { optionTitle: string; optionValue: string; sortOrder: number }[]; }
export interface User { id: string; userName: string; email: string; role: string; }
export interface Therapist { id: number; firstName: string; lastName: string; email: string; title: string; isActive: boolean; }

// İstatistikler
export interface DashboardStats {
    totalStudents: number;
    totalSessions: number;
    todaySessions: number;
    pendingForms: number;
}

// Randevu ve Terapist
export interface TherapistAvailability { id: number; name: string; category: string; currentLoad: number; dailySlots: number; campus: string; workingDays: string[]; }

// --- BU KISIM EKLENDİ (HATA BURADAYDI) ---
export interface AppointmentDetail {
    id: number;
    studentName: string;
    therapistName: string;
    date: string;
    time: string;
    status: string;
    type: string;
}

export interface PendingSession {
    id: number;
    name: string;
    department: string;
    requestDate: string;
}

export interface AppointmentRequest { 
    sessionId: number; 
    therapistId: number; 
    appointmentDate: string; 
    appointmentHour: string; 
    appointmentType: string; 
    locationOrLink: string; 
}
// ---------------------------------------------

// Başvuru / Seans Detayları
export interface SessionAnswer {
    questionId: number;
    questionTitle: string;
    answerValue: string;
    questionType: number;
    options: SessionOption[];
}

export interface SessionOption {
    label: string;
    value: string;
}

export interface SessionDetailDTO {
    sessionId: number;
    studentName: string;
    sessionDate: string;
    advisorName: string;
    answers: SessionAnswer[];
}

// Öğrenci Profili
export interface StudentSession {
    id: number;
    sessionDate: string;
    advisorId: number;
    isArchived: boolean;
    hasFeedback: boolean;
    feedbackSessionId?: number;
}

export interface StudentProfileDetail {
    id: number;
    studentNo: string;
    firstName: string;
    lastName: string;
    birthYear: string;
    gender: string;
    lifestyle: string;
    mobilePhone: string;
    email: string;
    contactDegree: string;
    contactPerson: string;
    contactPhone: string;
    faculty: string;
    department: string;
    semester: string;
    academicLevel: string;
    isScholar: string;
    isMotherAlive: string;
    isFatherAlive: string;
    parentMarriage: string;
    sessions: StudentSession[];
}

export interface SearchCriteria { studentNo?: string; firstName?: string; lastName?: string; }

// --- API YARDIMCILARI ---
const responseBody = <T>(response: AxiosResponse<T>) => response.data;

export const requests = {
    get: <T>(url: string) => axios.get<T>(url).then(responseBody),
    post: <T>(url: string, body: {}) => axios.post<T>(url, body).then(responseBody),
    put: <T>(url: string, body: {}) => axios.put<T>(url, body).then(responseBody),
    del: <T>(url: string) => axios.delete<T>(url).then(responseBody),
    download: (url: string, body: {}) => axios.post(url, body, { responseType: 'blob' })
};

// --- SERVİSLER ---

const Content = {
    getAll: () => requests.get<SiteContent[]>('/Content/GetAll'),
    update: (content: SiteContent) => requests.post('/Content/Update', content),
};

const Forms = {
    listQuestions: () => requests.get<Question[]>('/Forms/Questions'),
    createQuestion: (q: CreateQuestionDto) => requests.post('/Forms/CreateQuestion', q),
    deleteQuestion: (id: number) => requests.del(`/Forms/DeleteQuestion/${id}`),
};

const Users = {
    list: () => requests.get<User[]>('/Users/List'),
    create: (user: any) => requests.post('/Users/Create', user),
    delete: (id: string) => requests.del(`/Users/Delete/${id}`),
};

const Therapists = {
    list: () => requests.get<Therapist[]>('/Therapists/List'),
    create: (therapist: any) => requests.post('/Therapists/Create', therapist),
    delete: (id: number) => requests.del(`/Therapists/Delete/${id}`),
};

const Students = {
    getById: (id: any) => requests.get<StudentProfileDetail>(`/Students/${id}`),
    searchAdvanced: (criteria: any) => requests.post<StudentProfileDetail[]>('/Students/search', criteria),
    getByNo: (no: string) => requests.post<StudentProfileDetail[]>('/Students/search', { studentNo: no }).then(res => res[0]),
    apply: (payload: any) => requests.post('/Students/Apply', payload)
};

const Sessions = {
    getById: (id: number) => requests.get<SessionDetailDTO>(`/Sessions/${id}`),
    update: (id: number, data: any) => requests.put(`/Sessions/${id}`, data),
    getPending: () => requests.get<PendingSession[]>('/Sessions/pending') // Yeni eklenen metod
};

const Stats = {
    getDashboard: () => requests.get<DashboardStats>('/Statistics/Dashboard')
};

const Export = {
    toExcel: (criteria: any) => requests.download('/Export/ToExcel', criteria)
};

const Appointments = {
    getAvailableTherapists: (category: string) => requests.get<TherapistAvailability[]>(`/Appointments/AvailableTherapists?category=${category}`),
    getAll: () => requests.get<AppointmentDetail[]>('/Appointments/All'), // Yeni eklenen metod
    create: (data: any) => requests.post('/Appointments/Create', data)
};

const Reports = {
    getDashboard: () => requests.get('/reports/dashboard'),
    updateAppointmentStatus: (id: number, status: number, reason: string) => 
        requests.post('/appointments/update-status', { appointmentId: id, status, reason })
};

const Groups = {
    list: (therapistId: number) => requests.get(`/Groups/List/${therapistId}`),
    create: (data: any) => requests.post('/Groups/Create', data)
};

const agent = { 
    Content, 
    Forms, 
    Users, 
    Therapists, 
    Students, 
    Sessions, 
    Stats, 
    Export, 
    Appointments,
    Reports,
    Groups,
    Requests: requests
};

export default agent;