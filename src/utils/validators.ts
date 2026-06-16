import { z } from "zod"



export const loginSchema = z.object({
  email: z.string().email({ message: "Adresse e-mail invalide" }),
  password: z.string().min(1, { message: "Le mot de passe est requis" }),
  rememberMe: z.boolean(),
})

export const registerSchema = z.object({
  firstName: z.string().min(4, "Le prénom doit contenir au moins 4 caractères"),
  lastName: z.string().min(4, "Le nom doit contenir au moins 4 caractères"),
  email: z.string().email("Adresse e-mail invalide"),
  phone: z.string().regex(/^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/, "Numéro de téléphone invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "Vous devez accepter les conditions d'utilisation",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

export const FeatureSchema = z.object({
  label: z.string(),
  key: z.string(),
  type: z.enum(["number", "boolean"]),
  value: z.union([z.number(), z.boolean()])
})

export const PlanSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire"),
  slug: z.string().min(1),
  price_cents: z.number().min(0),
  monthly_credit: z.number().min(0),
  currency: z.string(),
  description: z.string().optional(),
  active: z.boolean(),
  is_public: z.boolean(),
  isPopular: z.boolean().optional(),
  features: z.array(FeatureSchema),
  sub_features: z.array(z.string()).optional(),
  type: z.enum(["starter", "professional", "enterprise"]).optional()
})

export type PlanFormValues = z.infer<typeof PlanSchema>
