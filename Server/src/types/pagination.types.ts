export type PaginationProps = {
    page: number
    limit: number
    offset: number
}

export type PaginationResult = {
    page: number
    prevPage: number | null
    nextPage: number | null
    totalPages: number
    totalRecords: number
}

export interface PaginatedResult<T> {
    rows: T[];
    total: number;
}

export interface CountRow {
    total: string;
}