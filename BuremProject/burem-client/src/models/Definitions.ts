// --- LİSTELEME TİPLERİ ---
export interface DefinitionItem {
    id: number;
    name: string;
}

export interface RoleItem {
    id: number;
    roleName: string;
}

export interface CustomHolidayItem {
    id: number;
    holidayDate: string; // YYYY-MM-DD
    description: string;
}

// --- İŞLEM DTO'LARI (Create/Update) ---

// Ekleme
export interface CreateDefinitionDto {
    name: string;
}
export interface CreateRoleDto {
    roleName: string;
}
export interface CreateHolidayDto {
    date: string;
    description: string;
    currentUserRoleId: number;
}

// Güncelleme
export interface UpdateDefinitionDto {
    id: number;
    name: string;
}
export interface UpdateRoleDto {
    id: number;
    roleName: string;
}

// API Sonuç Cevabı (Backend'den dönen ServiceResult)
export interface ServiceResult {
    isSuccess: boolean;
    message: string;
}