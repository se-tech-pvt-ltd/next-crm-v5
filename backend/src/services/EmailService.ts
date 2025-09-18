import { ConfigurationService } from "./ConfigurationService.js";
import { TemplateModel } from "../models/Template.js";

let cachedTransporter: any = null;

async function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  const cfg = await ConfigurationService.getConfig('smtp');
  if (!cfg || !cfg.host || !cfg.port || !cfg.user || !cfg.pass || !cfg.fromEmail) {
    throw new Error('Incomplete SMTP configuration. Please set host, port, user, pass, and fromEmail in configurations (name="smtp").');
  }
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: Number(cfg.port),
    secure: !!cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });
  try { await transporter.verify(); } catch {}
  cachedTransporter = transporter;
  return transporter;
}

function renderTemplate(template: string, vars: Record<string, string>): string {
  let out = template || '';
  for (const [key, val] of Object.entries(vars)) {
    const re = new RegExp(`{{\s*${key}\s*}}`, 'g');
    out = out.replace(re, val);
  }
  // If password/email placeholders not present, append a credentials block
  if (!/\{\{\s*password\s*\}\}/i.test(template) || !/\{\{\s*email\s*\}\}/i.test(template)) {
    const block = `\n\nLogin credentials:\nEmail: ${vars.email}\nPassword: ${vars.password}\nPlease log in and reset your credentials.`;
    out += block;
  }
  return out;
}

export class EmailService {
  static async sendTemplatedEmail(opts: { to: string; templateName: string; subject?: string; variables: Record<string, string>; }) {
    const { to, templateName, subject, variables } = opts;
    const rec = await TemplateModel.findByName(templateName);
    if (!rec || !rec.template) {
      throw new Error(`Email template not found: ${templateName}`);
    }
    const html = renderTemplate(rec.template, variables);
    const transporter = await getTransporter();
    const cfg = await ConfigurationService.getConfig('smtp');
    const finalSubject = subject || 'Account created - Next steps';
    const info = await transporter.sendMail({
      from: cfg.fromEmail,
      to,
      subject: finalSubject,
      html,
      text: html.replace(/<[^>]+>/g, '')
    });
    console.log(`Email sent to ${to}: ${info}`);
    return info;
  }
}
