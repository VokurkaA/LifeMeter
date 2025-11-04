import type { Context, Next } from "hono"
import { paginationConfig } from "@/config/pagination.config.js";

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

const PAGINATION_SYMBOL = Symbol.for("pagination")
const limit = paginationConfig.limit;

export function pagination(options?: { pageParam?: string }) {
    const pageParam = options?.pageParam || "page"

    return async (c: Context, next: Next) => {
        const rawPage = c.req.query(pageParam)
        let page = parseInt(rawPage || "1", 10)
        if (isNaN(page) || page < 1) page = 1

        const offset = (page - 1) * limit

        ;(c as any)[PAGINATION_SYMBOL] = {page, limit, offset} satisfies PaginationProps
        await next()
    }
}

export function getPagination(c: Context): PaginationProps {
    const data = (c as any)[PAGINATION_SYMBOL] as PaginationProps | undefined
    if (data) return data
    return {page: 1, limit, offset: 0}
}

export function makePaginationResult(totalRecords: number, c: Context): PaginationResult {
    const {page, limit} = getPagination(c)
    const totalPages = Math.max(1, Math.ceil(totalRecords / (limit || 1)))
    const safePage = Math.min(page, totalPages)
    const prevPage = safePage > 1 ? safePage - 1 : null
    const nextPage = safePage < totalPages ? safePage + 1 : null
    return {page: safePage, prevPage: prevPage, nextPage: nextPage, totalPages: totalPages, totalRecords: totalRecords}
}