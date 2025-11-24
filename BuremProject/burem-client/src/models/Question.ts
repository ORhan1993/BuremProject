// Backend'deki QuestionDto ile birebir aynı olmalı
export interface Option {
    ID: number;
    OptionTitle: string;
    OptionValue: string;
    SortOrder: number;
}

export interface Question {
    ID: number;
    QuestionTitle: string;
    QuestionType: number;
    SortOrder: number;
    Options: Option[];
}