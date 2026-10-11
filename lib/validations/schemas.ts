import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
})

export const signupSchema = z.object({
  displayName: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters.' })
    .max(50, { message: 'Name must be 50 characters or less.' })
    .trim(),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters.' })
    .regex(/[a-zA-Z]/, { message: 'Password must contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
})

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
})

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters.' })
    .regex(/[a-zA-Z]/, { message: 'Password must contain at least one letter.' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ['confirmPassword'],
})

export const expenseSchema = z.object({
  title: z
    .string()
    .min(1, { message: 'Title is required.' })
    .max(100, { message: 'Title must be 100 characters or less.' })
    .trim(),
  amount: z
    .string()
    .min(1, { message: 'Amount is required.' })
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be a positive number.',
    }),
  currency: z.string().min(1, { message: 'Currency is required.' }),
  category_id: z.string().optional().nullable(),
  merchant: z.string().max(100).trim().optional().nullable(),
  payment_method: z
    .enum(['cash', 'credit_card', 'debit_card', 'upi', 'net_banking', 'wallet', 'other'])
    .optional()
    .nullable(),
  transaction_date: z.string().min(1, { message: 'Date is required.' }),
  description: z.string().max(500).trim().optional().nullable(),
  notes: z.string().max(1000).trim().optional().nullable(),
  is_recurring: z.boolean().default(false),
  tag_ids: z.array(z.string()).default([]),
})

export const tagSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Tag name is required.' })
    .max(30, { message: 'Tag name must be 30 characters or less.' })
    .trim()
    .toLowerCase(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Please enter a valid hex color.' }),
})

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Category name is required.' })
    .max(50, { message: 'Category name must be 50 characters or less.' })
    .trim(),
  icon: z.string().optional().nullable(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Please enter a valid hex color.' })
    .optional()
    .nullable(),
})

export const profileSchema = z.object({
  display_name: z
    .string()
    .min(2, { message: 'Name must be at least 2 characters.' })
    .max(50, { message: 'Name must be 50 characters or less.' })
    .trim(),
  preferred_currency: z.string().min(1),
  preferred_locale: z.string().min(1),
  theme_preference: z.enum(['light', 'dark', 'system']),
})

export type LoginFormValues = z.infer<typeof loginSchema>
export type SignupFormValues = z.infer<typeof signupSchema>
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>
export type ExpenseFormValues = z.infer<typeof expenseSchema>
export type TagFormValues = z.infer<typeof tagSchema>
export type CategoryFormValues = z.infer<typeof categorySchema>
export type ProfileFormValues = z.infer<typeof profileSchema>
