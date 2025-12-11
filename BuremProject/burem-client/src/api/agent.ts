import axios from 'axios';
import type { AxiosResponse } from 'axios'; // 'type' kelimesi eklendi

axios.defaults.baseURL = 'http://localhost:5221/api';

// --- TİP TANIMLARI (EKSİKLER EKLENDİ) ---
export interface SiteContent { key: string; value: string; }
export interface QuestionOption { id?: number; optionTitle: string; optionValue: string; sortOrder: number; }
export interface Question { id: number; sortOrder: number; questionTitle: string; questionType: number; questionGroup: number; appForm: number; options: QuestionOption[]; }
export interface CreateQuestionDto { id?: number; sortOrder: number; questionTitle: string; questionType: number; questionGroup: number; options: { optionTitle: string; optionValue: string; sortOrder: number }[]; }
export interface User { id: number; userName: string; email: string; role: string; firstName?: string; lastName?: string; isActive: boolean; }
export interface Therapist { id: number; firstName: string; lastName: string; email: string; title: string; isActive: boolean; }

// Tanımlamalar İçin Eklenen Tipler
export interface DefinitionItem { id: number; name: string; }
export interface RoleItem { id: number; roleName: string; }
export interface CustomHolidayItem { id: number; holidayDate: string; description: string; }
export interface CreateDefinitionDto { name: string; }
export interface UpdateDefinitionDto { id: number; name: string; }
export interface CreateRoleDto { roleName: string; }
export interface UpdateRoleDto { id: number; roleName: string; }
export interface CreateHolidayDto { date: string; description: string; currentUserRoleId?: number; }
export interface ServiceResult { succeeded: boolean; message: string; data?: any; }

export interface DashboardStats {
    totalStudents: number;
    totalSessions: number;
    todaySessions: number;
    pendingForms: number;
    activeCases?: number;
    riskCases?: number;
    completedProcess?: number;
}

export interface TherapistAvailability { id: number; name: string; category: string; currentLoad: number; dailySlots: number; campus: string; workingDays: string[]; }
export interface AppointmentDetail { id: number; studentName: string; studentId?: string; therapistName: string; date: string; time: string; status: string; type: string; note?: string; currentSessionCount?: number; }
export interface PendingSession { id: number; name: string; department: string; requestDate: string; }
export interface SessionAnswer { questionId: number; questionTitle: string; answerValue: string; questionType: number; options: any[]; }
export interface SessionDetailDTO { sessionId: number; studentName: string; studentNumber?: string; sessionDate: string; advisorName: string; preferredMeetingType?: string; answers: SessionAnswer[]; }
export interface StudentSession { id: number; sessionDate: string; advisorId: number; isArchived: boolean; hasFeedback: boolean; feedbackSessionId?: number; }

export interface StudentProfileDetail {
    id: number; studentNo: string; firstName: string; lastName: string; birthYear: string; gender: string; lifestyle: string;
    mobilePhone: string; email: string; contactDegree: string; contactPerson: string; contactPhone: string;
    faculty: string; department: string; semester: string; academicLevel: string;
    isScholar: string; isMotherAlive: string; isFatherAlive: string; parentMarriage: string;
    sessions: StudentSession[]; formAnswers?: any[]; pastNotes?: any[]; grade?: string; gpa?: string; riskLevel?: string;
}
export interface StudentPreFillInfo { studentNo: string; firstName: string; lastName: string; email: string; mobilePhone: string; gender: string; birthYear: string; faculty: string; department: string; semester: string; academicLevel: string; }

const responseBody = <T>(response: AxiosResponse<T>) => response.data;

export const requests = {
    get: <T>(url: string) => axios.get<T>(url).then(responseBody),
    post: <T>(url: string, body: {}) => axios.post<T>(url, body).then(responseBody),
    put: <T>(url: string, body: {}) => axios.put<T>(url, body).then(responseBody),
    del: <T>(url: string) => axios.delete<T>(url).then(responseBody),
    download: (url: string, body: {}) => axios.post(url, body, { responseType: 'blob' })
};

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
    list: () => requests.get<User[]>('/Users/List'), // DÜZELTİLDİ: Users endpointi
    create: (user: any) => requests.post('/Users/Create', user),
    update: (id: number, user: any) => requests.put(`/Users/Update/${id}`, user),
    delete: (id: number) => requests.del(`/Users/Delete/${id}`),
};

const Therapists = {
    list: () => requests.get<Therapist[]>('/Therapists/List'),
    create: (therapist: any) => requests.post('/Therapists/Create', therapist),
    update: (id: number, therapist: any) => requests.put(`/Therapists/Update/${id}`, therapist),
    delete: (id: number) => requests.del(`/Therapists/Delete/${id}`),
};

const Secretaries = {
    list: () => requests.get<User[]>('/Secretaries/List'), // Not: Backend'de User üzerinden çekiyorsak burayı Users endpointine yönlendirebiliriz.
    create: (secretary: any) => requests.post('/Secretaries/Create', secretary),
    update: (id: number, secretary: any) => requests.put(`/Secretaries/Update/${id}`, secretary),
    delete: (id: number) => requests.del(`/Secretaries/Delete/${id}`),
};

const Students = {
    getById: (id: number) => requests.get<StudentProfileDetail>(`/Students/${id}`),
    searchAdvanced: (criteria: any) => requests.post<StudentProfileDetail[]>('/Students/search', criteria),
    getByNo: (no: string) => requests.post<StudentProfileDetail[]>('/Students/search', { studentNo: no }).then(res => res[0]),
    apply: (payload: any) => requests.post('/Students/Apply', payload),
    getInfo: (studentNo: string) => requests.get<StudentPreFillInfo>(`/Students/info/${studentNo}`)
};

const Sessions = {
    getById: (id: number) => requests.get<SessionDetailDTO>(`/Sessions/${id}`),
    update: (id: number, data: any) => requests.put(`/Sessions/${id}`, data),
    getPending: () => requests.get<PendingSession[]>('/Sessions/pending') 
};

const Stats = {
    getDashboard: () => requests.get<DashboardStats>('/Statistics/Dashboard')
};

const Export = {
    toExcel: (criteria: any) => requests.download('/Export/ToExcel', criteria)
};

const Appointments = {
    getAvailableTherapists: (category: string) => requests.get<TherapistAvailability[]>(`/Appointments/AvailableTherapists?category=${category}`),
    getAll: () => requests.get<AppointmentDetail[]>('/Appointments/All'),
    // YENİ EKLENDİ: Terapistin kendi randevuları
    getMyAppointments: () => requests.get<AppointmentDetail[]>('/Appointments/MyAppointments'),
    getSchedule: () => requests.get<any[]>('/Appointments/Schedule'), // Sekreter takvimi için
    create: (data: any) => requests.post('/Appointments/Create', data)
};

const Definitions = {
    listCampuses: () => requests.get<DefinitionItem[]>('/definitions/campuses'),
    createCampus: (data: CreateDefinitionDto) => requests.post<ServiceResult>('/definitions/campuses', data),
    deleteCampus: (id: number) => requests.del<ServiceResult>(`/definitions/campuses/${id}`),

    listTherapistTypes: () => requests.get<DefinitionItem[]>('/definitions/therapist-types'),
    createTherapistType: (data: CreateDefinitionDto) => requests.post<ServiceResult>('/definitions/therapist-types', data),
    deleteTherapistType: (id: number) => requests.del<ServiceResult>(`/definitions/therapist-types/${id}`),

    listRoles: () => requests.get<RoleItem[]>('/definitions/roles'),
    createRole: (data: CreateRoleDto) => requests.post<ServiceResult>('/definitions/roles', data),
    deleteRole: (id: number) => requests.del<ServiceResult>(`/definitions/roles/${id}`),

    listHolidays: () => requests.get<CustomHolidayItem[]>('/definitions/holidays'),
    createHoliday: (data: CreateHolidayDto) => requests.post<ServiceResult>('/definitions/add-holiday', data),
    deleteHoliday: (id: number) => requests.del<ServiceResult>(`/definitions/holidays/${id}`),
};

const agent = { Content, Forms, Users, Therapists, Secretaries, Students, Sessions, Stats, Export, Appointments, Definitions };
export default agent;