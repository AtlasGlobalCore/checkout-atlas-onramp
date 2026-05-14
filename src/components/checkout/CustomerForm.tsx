'use client';

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n, type Locale } from '@/i18n/provider';
import { countryList } from '@/i18n/translations';
import type { TK } from '@/i18n/provider';

export interface CustomerFormData {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  dob: string;
  country: string;
  address1: string;
  address2: string;
  city: string;
  zip: string;
  state: string;
  declarationAccepted: boolean;
}

interface CustomerFormProps {
  initialData: Partial<CustomerFormData> | null;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onBack: () => void;
}

interface FieldErrors {
  [key: string]: string;
}

export default function CustomerForm({ initialData, onSubmit, onBack }: CustomerFormProps) {
  const { t, locale } = useI18n();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});

  const [form, setForm] = useState<CustomerFormData>({
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    dob: initialData?.dob || '',
    country: initialData?.country || '',
    address1: initialData?.address1 || '',
    address2: initialData?.address2 || '',
    city: initialData?.city || '',
    zip: initialData?.zip || '',
    state: initialData?.state || '',
    declarationAccepted: initialData?.declarationAccepted || false,
  });

  const updateField = useCallback((field: keyof CustomerFormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const validate = useCallback((): boolean => {
    const newErrors: FieldErrors = {};

    // Email
    if (!form.email.trim()) {
      newErrors.email = t('validation.required' as TK);
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = t('validation.email' as TK);
    }

    // Required fields
    const requiredFields: (keyof CustomerFormData)[] = [
      'firstName', 'lastName', 'country', 'address1', 'city', 'zip',
    ];
    for (const field of requiredFields) {
      const value = form[field];
      if (typeof value !== 'string' || !value.trim()) {
        newErrors[field] = t('validation.required' as TK);
      }
    }

    // Declaration (L1 requirement)
    if (!form.declarationAccepted) {
      newErrors.declarationAccepted = t('declaration.error' as TK);
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [form, t]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(form);
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  }, [form, validate, onSubmit]);

  const countryKey = (code: string): TK =>
    `country.${code}` as TK;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Title */}
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-1">
          {t('customer.title')}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t('customer.subtitle')}
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white rounded-xl border border-border p-5 sm:p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
        <div className="space-y-4">
          {/* Email + Phone row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-foreground">
                {t('customer.email')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder={t('customer.email.placeholder' as TK)}
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className={`h-11 ${errors.email ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/30' : ''}`}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1">{errors.email}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-medium text-foreground">
                {t('customer.phone')}
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder={t('customer.phone.placeholder' as TK)}
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="h-11"
                autoComplete="tel"
              />
            </div>
          </div>

          {/* Name row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="firstName" className="text-xs font-medium text-foreground">
                {t('customer.firstName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder={t('customer.firstName.placeholder' as TK)}
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                className={`h-11 ${errors.firstName ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/30' : ''}`}
                autoComplete="given-name"
              />
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName" className="text-xs font-medium text-foreground">
                {t('customer.lastName')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                type="text"
                placeholder={t('customer.lastName.placeholder' as TK)}
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                className={`h-11 ${errors.lastName ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/30' : ''}`}
                autoComplete="family-name"
              />
              {errors.lastName && (
                <p className="text-xs text-red-500 mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>

          {/* DOB + Country row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dob" className="text-xs font-medium text-foreground">
                {t('customer.dob')}
              </Label>
              <Input
                id="dob"
                type="date"
                value={form.dob}
                onChange={(e) => updateField('dob', e.target.value)}
                className="h-11"
                autoComplete="bday"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country" className="text-xs font-medium text-foreground">
                {t('customer.country')} <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.country}
                onValueChange={(v) => updateField('country', v)}
              >
                <SelectTrigger
                  id="country"
                  className={`w-full h-11 ${errors.country ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/30' : ''}`}
                >
                  <SelectValue placeholder={t('customer.country')} />
                </SelectTrigger>
                <SelectContent>
                  {countryList.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      <span className="flex items-center gap-2">
                        <span>{c.flag}</span>
                        <span>{t(countryKey(c.code))}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.country && (
                <p className="text-xs text-red-500 mt-1">{errors.country}</p>
              )}
            </div>
          </div>

          {/* Address section */}
          <div className="space-y-1.5">
            <Label htmlFor="address1" className="text-xs font-medium text-foreground">
              {t('customer.address1')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address1"
              type="text"
              placeholder={t('customer.address1.placeholder' as TK)}
              value={form.address1}
              onChange={(e) => updateField('address1', e.target.value)}
              className={`h-11 ${errors.address1 ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/30' : ''}`}
              autoComplete="address-line1"
            />
            {errors.address1 && (
              <p className="text-xs text-red-500 mt-1">{errors.address1}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address2" className="text-xs font-medium text-foreground">
              {t('customer.address2')}
            </Label>
            <Input
              id="address2"
              type="text"
              placeholder={t('customer.address2.placeholder' as TK)}
              value={form.address2}
              onChange={(e) => updateField('address2', e.target.value)}
              className="h-11"
              autoComplete="address-line2"
            />
          </div>

          {/* City, ZIP, State */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="city" className="text-xs font-medium text-foreground">
                {t('customer.city')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="city"
                type="text"
                placeholder={t('customer.city')}
                value={form.city}
                onChange={(e) => updateField('city', e.target.value)}
                className={`h-11 ${errors.city ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/30' : ''}`}
                autoComplete="address-level2"
              />
              {errors.city && (
                <p className="text-xs text-red-500 mt-1">{errors.city}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="zip" className="text-xs font-medium text-foreground">
                {t('customer.zip')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="zip"
                type="text"
                placeholder={t('customer.zip.placeholder' as TK)}
                value={form.zip}
                onChange={(e) => updateField('zip', e.target.value)}
                className={`h-11 ${errors.zip ? 'border-red-400 focus-visible:border-red-400 focus-visible:ring-red-400/30' : ''}`}
                autoComplete="postal-code"
              />
              {errors.zip && (
                <p className="text-xs text-red-500 mt-1">{errors.zip}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="state" className="text-xs font-medium text-foreground">
                {t('customer.state')}
              </Label>
              <Input
                id="state"
                type="text"
                placeholder={t('customer.state.placeholder' as TK)}
                value={form.state}
                onChange={(e) => updateField('state', e.target.value)}
                className="h-11"
                autoComplete="address-level1"
              />
            </div>
          </div>

          {/* L1 Declaration */}
          <div className="pt-2 border-t border-border">
            <div className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${errors.declarationAccepted ? 'bg-red-50' : 'bg-secondary/40'}`}>
              <Checkbox
                id="declaration"
                checked={form.declarationAccepted}
                onCheckedChange={(checked) => updateField('declarationAccepted', !!checked)}
                className="mt-0.5 shrink-0"
              />
              <Label
                htmlFor="declaration"
                className={`text-xs leading-relaxed cursor-pointer ${errors.declarationAccepted ? 'text-red-700' : 'text-muted-foreground'}`}
              >
                {t('declaration.label' as TK)}
              </Label>
            </div>
            {errors.declarationAccepted && (
              <p className="text-xs text-red-500 mt-1.5 ml-1">{errors.declarationAccepted}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-12 sm:h-11 w-full sm:w-auto rounded-lg gap-2 text-sm font-medium border-border hover:bg-secondary"
        >
          <ArrowLeft className="size-4" />
          {t('btn.back')}
        </Button>
        <motion.div className="flex-1 sm:flex-none" whileTap={{ scale: 0.98 }}>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full sm:w-auto h-12 sm:h-11 sm:min-w-[160px] bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold rounded-lg gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t('btn.loading')}
              </>
            ) : (
              <>
                {t('btn.continue')}
                <ArrowRight className="size-4" />
              </>
            )}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
