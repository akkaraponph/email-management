export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export interface DemoVariable {
  id: string;
  key: string;
  name: string;
  type: 'TEXT' | 'DATE' | 'NUMBER' | 'EMAIL' | 'URL' | 'BOOLEAN';
  defaultValue?: string | null;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  required: boolean;
  emailTemplateId: string;
}

export interface DemoPreviewData {
  id: string;
  name: string;
  data: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
  emailTemplateId: string;
}

export interface DemoTemplate {
  id: string;
  name: string;
  description?: string | null;
  defaultContent: string;
  createdAt: Date;
  updatedAt: Date;
  userId?: string | null;
  isSystem: boolean;
  foldererId?: string | null;
  variables: DemoVariable[];
  previewData: DemoPreviewData[];
}

export interface DemoTemplateInput {
  name: string;
  description?: string;
  defaultContent: string;
  variables?: Array<Pick<DemoVariable, 'key' | 'name' | 'type' | 'required' | 'defaultValue' | 'description'>>;
  previewData?: Record<string, unknown>;
  userId?: string;
  folderId?: string;
}

const STORAGE_KEY = 'email-template-demo-store-v1';

const now = () => new Date();

const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

const createSeedTemplate = (
  idValue: string,
  name: string,
  description: string,
  content: string,
  variables: Array<Pick<DemoVariable, 'key' | 'name' | 'type' | 'required'>>,
  previewData: Record<string, unknown>,
): DemoTemplate => {
  const createdAt = now();

  return {
    id: idValue,
    name,
    description,
    defaultContent: content,
    createdAt,
    updatedAt: createdAt,
    isSystem: true,
    variables: variables.map((variable) => ({
      ...variable,
      id: `${idValue}-${variable.key}`,
      createdAt,
      updatedAt: createdAt,
      emailTemplateId: idValue,
    })),
    previewData: [{
      id: `${idValue}-preview`,
      name: 'Default Preview',
      data: previewData,
      createdAt,
      updatedAt: createdAt,
      emailTemplateId: idValue,
    }],
  };
};

const createSeedTemplates = () => [
  createSeedTemplate(
    'demo-welcome-email',
    'Welcome email',
    'A warm introduction for new subscribers.',
    '<h1>Welcome, {{.firstName}}!</h1><p>We are glad you are here.</p>',
    [{ key: 'firstName', name: 'First Name', type: 'TEXT', required: true }],
    { firstName: 'Taylor' },
  ),
  createSeedTemplate(
    'demo-order-confirmation',
    'Order confirmation',
    'A clear receipt and next-steps email.',
    '<h1>Thanks for your order, {{.firstName}}</h1><p>Your order {{.orderNumber}} is confirmed.</p>',
    [
      { key: 'firstName', name: 'First Name', type: 'TEXT', required: true },
      { key: 'orderNumber', name: 'Order Number', type: 'TEXT', required: true },
    ],
    { firstName: 'Taylor', orderNumber: '#1048' },
  ),
  createSeedTemplate(
    'demo-password-reset',
    'Password reset',
    'A concise password-reset message.',
    '<h1>Reset your password</h1><p>Hi {{.firstName}}, use this link to choose a new password: {{.resetLink}}</p>',
    [
      { key: 'firstName', name: 'First Name', type: 'TEXT', required: true },
      { key: 'resetLink', name: 'Reset Link', type: 'URL', required: true },
    ],
    { firstName: 'Taylor', resetLink: 'https://example.com/reset' },
  ),
];

const hydrateTemplate = (template: DemoTemplate): DemoTemplate => ({
  ...template,
  createdAt: new Date(template.createdAt),
  updatedAt: new Date(template.updatedAt),
  variables: template.variables.map((variable) => ({
    ...variable,
    createdAt: new Date(variable.createdAt),
    updatedAt: new Date(variable.updatedAt),
  })),
  previewData: template.previewData.map((preview) => ({
    ...preview,
    createdAt: new Date(preview.createdAt),
    updatedAt: new Date(preview.updatedAt),
  })),
});

export const createDemoTemplateStore = (storage: StorageLike) => {
  const read = (): DemoTemplate[] => {
    const value = storage.getItem(STORAGE_KEY);

    if (!value) {
      const templates = createSeedTemplates();
      write(templates);
      return templates;
    }

    try {
      return (JSON.parse(value) as DemoTemplate[]).map(hydrateTemplate);
    } catch {
      const templates = createSeedTemplates();
      write(templates);
      return templates;
    }
  };

  const write = (templates: DemoTemplate[]) => storage.setItem(STORAGE_KEY, JSON.stringify(templates));

  const update = (templateId: string, updater: (template: DemoTemplate) => DemoTemplate) => {
    const templates = read();
    const index = templates.findIndex((template) => template.id === templateId);

    if (index === -1) throw new Error('Template not found');

    const nextTemplate = updater(templates[index]);
    templates[index] = nextTemplate;
    write(templates);
    return nextTemplate;
  };

  return {
    listTemplates: () => read(),
    getTemplate: (templateId: string) => {
      const template = read().find((item) => item.id === templateId);
      if (!template) throw new Error('Template not found');
      return template;
    },
    createTemplate: (input: DemoTemplateInput) => {
      const createdAt = now();
      const templateId = id('template');
      const template: DemoTemplate = {
        id: templateId,
        name: input.name,
        description: input.description ?? null,
        defaultContent: input.defaultContent,
        createdAt,
        updatedAt: createdAt,
        userId: input.userId ?? null,
        foldererId: input.folderId ?? null,
        isSystem: false,
        variables: (input.variables ?? []).map((variable) => ({
          ...variable,
          id: id('variable'),
          createdAt,
          updatedAt: createdAt,
          emailTemplateId: templateId,
        })),
        previewData: [{
          id: id('preview'),
          name: 'Default Preview',
          data: input.previewData ?? {},
          createdAt,
          updatedAt: createdAt,
          emailTemplateId: templateId,
        }],
      };
      const templates = read();
      write([...templates, template]);
      return template;
    },
    updateTemplate: (templateId: string, input: Partial<DemoTemplateInput>) => update(templateId, (template) => ({
      ...template,
      name: input.name ?? template.name,
      description: input.description ?? template.description,
      defaultContent: input.defaultContent ?? template.defaultContent,
      updatedAt: now(),
    })),
    deleteTemplate: (templateId: string) => {
      const templates = read();
      const template = templates.find((item) => item.id === templateId);
      if (!template) throw new Error('Template not found');
      if (template.isSystem) throw new Error('System templates cannot be deleted');
      write(templates.filter((item) => item.id !== templateId));
    },
    getVariables: (templateId: string) => read().find((item) => item.id === templateId)?.variables ?? [],
    addVariable: (templateId: string, variable: Omit<DemoVariable, 'id' | 'createdAt' | 'updatedAt' | 'emailTemplateId'>) => {
      const createdAt = now();
      const created = { ...variable, id: id('variable'), createdAt, updatedAt: createdAt, emailTemplateId: templateId };
      update(templateId, (template) => ({ ...template, variables: [...template.variables, created], updatedAt: createdAt }));
      return created;
    },
    updateVariable: (templateId: string, variableId: string, input: Partial<Omit<DemoVariable, 'id' | 'createdAt' | 'updatedAt' | 'emailTemplateId'>>) => {
      let updated: DemoVariable | undefined;
      update(templateId, (template) => ({
        ...template,
        variables: template.variables.map((variable) => {
          if (variable.id !== variableId) return variable;
          updated = { ...variable, ...input, updatedAt: now() };
          return updated;
        }),
        updatedAt: now(),
      }));
      if (!updated) throw new Error('Variable not found');
      return updated;
    },
    deleteVariable: (templateId: string, variableId: string) => update(templateId, (template) => ({
      ...template,
      variables: template.variables.filter((variable) => variable.id !== variableId),
      updatedAt: now(),
    })),
    updatePreviewData: (templateId: string, data: Record<string, unknown>, name = 'Default Preview') => {
      const updatedAt = now();
      let preview: DemoPreviewData | undefined;
      update(templateId, (template) => {
        preview = {
          ...(template.previewData[0] ?? { id: id('preview'), createdAt: updatedAt, emailTemplateId: templateId }),
          name,
          data,
          updatedAt,
        };
        return { ...template, previewData: [preview], updatedAt };
      });
      return preview!;
    },
  };
};

export const getBrowserDemoTemplateStore = () => {
  if (typeof window === 'undefined') throw new Error('Demo storage is only available in the browser');
  return createDemoTemplateStore(window.localStorage);
};
