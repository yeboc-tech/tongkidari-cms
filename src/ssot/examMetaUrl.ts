/**
 * SSOT: 시험 메타 파일 URL 생성 유틸리티
 * Single Source of Truth for exam metadata file URLs
 */

import { CDN_BASE_URL } from '../env';

const META_BASE_URL = `${CDN_BASE_URL}meta`;

/**
 * 문제 CSV 파일명 생성
 * @param examId - 시험 ID
 * @returns 파일명
 */
export const getProblemCsvFilename = (examId: string): string => {
  return `${examId}_문제.csv`;
};

/**
 * 문제 CSV 파일의 전체 URL 생성
 * @param examId - 시험 ID
 * @returns 문제 CSV 파일 URL
 */
export const getProblemCsvUrl = (examId: string): string => {
  return `${META_BASE_URL}/${getProblemCsvFilename(examId)}`;
};

/**
 * 해설 CSV 파일명 생성
 * @param examId - 시험 ID
 * @returns 파일명
 */
export const getAnswerCsvFilename = (examId: string): string => {
  return `${examId}_해설.csv`;
};

/**
 * 해설 CSV 파일의 전체 URL 생성
 * @param examId - 시험 ID
 * @returns 해설 CSV 파일 URL
 */
export const getAnswerCsvUrl = (examId: string): string => {
  return `${META_BASE_URL}/${getAnswerCsvFilename(examId)}`;
};

/**
 * 문제 페이지 이미지 파일명 생성
 * @param examId - 시험 ID
 * @param page - 페이지 번호 (1-4)
 * @returns 파일명
 */
export const getProblemPageFilename = (examId: string, page: number): string => {
  return `${examId}_문제_p${page}.png`;
};

/**
 * 문제 페이지 이미지 파일의 전체 URL 생성
 * @param examId - 시험 ID
 * @param page - 페이지 번호 (1-4)
 * @returns 문제 페이지 이미지 URL
 */
export const getProblemPageUrl = (examId: string, page: number): string => {
  return `${META_BASE_URL}/${getProblemPageFilename(examId, page)}`;
};

/**
 * 문제 디버그 이미지 파일명 생성
 * @param examId - 시험 ID
 * @param page - 페이지 번호 (1-4)
 * @returns 파일명
 */
export const getProblemDebugFilename = (examId: string, page: number): string => {
  return `${examId}_문제_p${page}_debug.png`;
};

/**
 * 문제 디버그 이미지 파일의 전체 URL 생성
 * @param examId - 시험 ID
 * @param page - 페이지 번호 (1-4)
 * @returns 문제 디버그 이미지 URL
 */
export const getProblemDebugUrl = (examId: string, page: number): string => {
  return `${META_BASE_URL}/${getProblemDebugFilename(examId, page)}`;
};

/**
 * 정확도 CSV 파일명 생성
 * @param examId - 시험 ID
 * @returns 파일명
 */
export const getAccuracyRateCsvFilename = (examId: string): string => {
  return `${examId}_accuracy_rate.csv`;
};

/**
 * 정확도 CSV 파일의 전체 URL 생성
 * @param examId - 시험 ID
 * @returns 정확도 CSV 파일 URL
 */
export const getAccuracyRateCsvUrl = (examId: string): string => {
  return `${META_BASE_URL}/${getAccuracyRateCsvFilename(examId)}`;
};

/**
 * 레이블 CSV 파일명 생성
 * @param examId - 시험 ID
 * @returns 파일명
 */
export const getLabelCsvFilename = (examId: string): string => {
  return `${examId}_label.csv`;
};

/**
 * 레이블 CSV 파일의 전체 URL 생성
 * @param examId - 시험 ID
 * @returns 레이블 CSV 파일 URL
 */
export const getLabelCsvUrl = (examId: string): string => {
  return `${META_BASE_URL}/${getLabelCsvFilename(examId)}`;
};

/**
 * 히스토리 CSV 파일명 생성
 * @param examId - 시험 ID
 * @returns 파일명
 */
export const getHistoryCsvFilename = (examId: string): string => {
  return `${examId}_히스토리.csv`;
};

/**
 * 히스토리 CSV 파일의 전체 URL 생성
 * @param examId - 시험 ID
 * @returns 히스토리 CSV 파일 URL
 */
export const getHistoryCsvUrl = (examId: string): string => {
  return `${META_BASE_URL}/${getHistoryCsvFilename(examId)}`;
};

/**
 * PDF 파일명 생성
 * @param examId - 시험 ID
 * @returns 파일명
 */
export const getPdfFilename = (examId: string): string => {
  return `${examId}.pdf`;
};

/**
 * PDF 파일의 전체 URL 생성
 * @param examId - 시험 ID
 * @returns PDF 파일 URL
 */
export const getPdfUrl = (examId: string): string => {
  return `${CDN_BASE_URL}pdfs/${getPdfFilename(examId)}`;
};

/**
 * PDF 목록 CSV 파일의 전체 URL 생성
 * @returns PDF 목록 CSV 파일 URL
 */
export const getPdfListCsvUrl = (): string => {
  return `${CDN_BASE_URL}pdfs/list.csv`;
};
