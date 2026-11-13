import { z } from "zod";

export const cartSchema = z.array(
  z.object({
    productId: z.string(),
    quantity: z.number().int().positive(),
  }),
);

export const newsletterSchema = z.object({
  email: z.email("Enter a valid email address."),
});

export const orderSchema = z.object({
  email: z.email("Enter a valid email address."),
  firstName: z.string().trim().min(1, "Enter your first name."),
  lastName: z.string().trim().min(1, "Enter your last name."),
  address: z.string().trim().min(5, "Enter a complete street address."),
  city: z.string().trim().min(2, "Enter a city."),
  postalCode: z.string().trim().min(5, "Enter a postal code."),
  itemCount: z.number().int().positive("Your trip kit is empty."),
});

export type OrderInput = z.infer<typeof orderSchema>;

export const preferencesSchema = z.object({
  tripLength: z.enum(["day", "weekend", "week"]),
  interests: z.array(z.enum(["camp", "trail", "kitchen", "navigation"])),
  fieldNotes: z.boolean(),
});

export type Preferences = z.infer<typeof preferencesSchema>;
