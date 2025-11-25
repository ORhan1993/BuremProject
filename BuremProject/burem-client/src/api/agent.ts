import axios from 'axios';
import type { AxiosResponse } from 'axios';

// Backend URL'nizi buraya girin (Port numarasını kontrol edin)
axios.defaults.baseURL = 'http://localhost:5221/api';

// --- TİP TANIMLARI (INTERFACES) ---

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
export interface AppointmentRequest { sessionId: number; therapistId: number; date: string; time: string; type: string; roomLink: string; }

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

// Öğrenci Profili (Detay Sayfası İçin)
export interface StudentSession {
    id: number;
    sessionDate: string;
    advisorId: number;
    isArchived: boolean;
    hasFeedback: boolean;
    feedbackSessionId?: number; // Varsa ID
}

export interface StudentProfileDetail {
    id: number;
    studentNo: string;
    firstName: string;
    lastName: string;
    // Aşağıdaki alanlar backend'den string (dönüştürülmüş) olarak gelecek
    birthYear: string;
    gender: string;
    lifestyle: string;
    mobilePhone: string;
    email: string;
    // İletişim
    contactDegree: string;
    contactPerson: string;
    contactPhone: string;
    // Akademik
    faculty: string;
    department: string;
    semester: string;
    academicLevel: string;
    isScholar: string;
    // Aile
    isMotherAlive: string;
    isFatherAlive: string;
    parentMarriage: string;
    // Başvuru Geçmişi
    sessions: StudentSession[];
}

export interface SearchCriteria { studentNo?: string; firstName?: string; lastName?: string; }


// --- API YARDIMCILARI ---
const responseBody = <T>(response: AxiosResponse<T>) => response.data;

const requests = {
    get: <T>(url: string) => axios.get<T>(url).then(responseBody),
    post: <T>(url: string, body: {}) => axios.post<T>(url, body).then(responseBody),
    put: <T>(url: string, body: {}) => axios.put<T>(url, body).then(responseBody),
    del: <T>(url: string) => axios.delete<T>(url).then(responseBody),
    // Dosya indirmek için blob tipi
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
    // ID ile detay getir (Backend'deki StudentsController.GetStudentById metodunu çağırır)
    getById: (id: any) => requests.get<StudentProfileDetail>(`/Students/${id}`),
    
    // Gelişmiş Arama
    searchAdvanced: (criteria: any) => requests.post<StudentProfileDetail[]>('/Students/search', criteria),
    
    // Numara ile tekil arama (Basit arama)
    getByNo: (no: string) => requests.post<StudentProfileDetail[]>('/Students/search', { studentNo: no }).then(res => res[0])
};

const Sessions = {
    // Başvuru Detayı (Backend'deki SessionsController.GetSessionDetail)
    getById: (id: number) => requests.get<SessionDetailDTO>(`/Sessions/${id}`),
    
    // Başvuru Güncelleme
    update: (id: number, data: any) => requests.put(`/Sessions/${id}`, data)
};

const Stats = {
    getDashboard: () => requests.get<DashboardStats>('/Statistics/Dashboard')
};

const Export = {
    toExcel: (criteria: any) => requests.download('/Export/ToExcel', criteria)
};

const Appointments = {
    getAvailableTherapists: (category: string) => requests.get<TherapistAvailability[]>(`/Appointments/AvailableTherapists?category=${category}`),
    create: (data: AppointmentRequest) => requests.post('/Appointments/Create', data)
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
    Appointments 
};

export default agent;