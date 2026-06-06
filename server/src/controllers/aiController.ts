import type { Request, Response } from 'express';
import User from '../models/User';

/**
 * AI Script Breakdown
 * Analyzes a script and returns suggested crew list, equipment list, and schedule estimate.
 * Uses rule-based heuristics (can be upgraded to OpenAI/Gemini API later).
 */
export const breakdownScript = async (req: Request, res: Response): Promise<void> => {
  try {
    const { script, projectType } = req.body as { script: string; projectType?: string };
    if (!script || script.trim().length < 20) {
      res.status(400).json({ success: false, message: 'Script content is too short' });
      return;
    }

    const words = script.split(/\s+/).length;
    const scenes = (script.match(/\b(INT\.|EXT\.|SCENE|ACT)\b/gi) ?? []).length || Math.ceil(words / 150);
    const hasDialogue = /["'](.*?)["']|CHARACTER:|V\.O\.|O\.S\./.test(script);
    const hasDroneShot = /drone|aerial|wide shot|establishing|flyover/i.test(script);
    const hasNightScene = /night|EXT\..*NIGHT|INT\..*NIGHT/i.test(script);
    const hasActionScene = /action|fight|chase|runs|explosion/i.test(script);
    const hasMusicPerformance = /music|concert|perform|band|stage/i.test(script);

    const crewList: { role: string; count: number; priority: 'required' | 'recommended' | 'optional' }[] = [
      { role: 'Director', count: 1, priority: 'required' },
      { role: 'Director of Photography (DOP)', count: 1, priority: 'required' },
      { role: 'Camera Operator', count: scenes > 5 ? 2 : 1, priority: 'required' },
      { role: 'Gaffer / Lighting Director', count: 1, priority: 'required' },
      { role: 'Sound Recordist', count: 1, priority: hasDialogue ? 'required' : 'recommended' },
      { role: 'Production Assistant', count: Math.ceil(scenes / 4), priority: 'recommended' },
      { role: 'Art Director / Set Designer', count: 1, priority: scenes > 3 ? 'recommended' : 'optional' },
      { role: 'Makeup & Hair Stylist', count: 1, priority: 'recommended' },
      { role: 'Script Supervisor', count: 1, priority: 'recommended' },
      { role: 'Drone Pilot', count: 1, priority: hasDroneShot ? 'required' : 'optional' },
      { role: 'Colorist / Post-Production Editor', count: 1, priority: 'required' },
      { role: 'Sound Designer', count: 1, priority: hasDialogue ? 'recommended' : 'optional' },
      { role: 'Music Supervisor', count: 1, priority: hasMusicPerformance ? 'required' : 'optional' },
    ];

    const equipmentList: { item: string; quantity: number; note?: string }[] = [
      { item: 'Cinema Camera (4K)', quantity: scenes > 5 ? 2 : 1 },
      { item: 'Prime Lens Set', quantity: 1 },
      { item: 'LED Panel Lights', quantity: hasNightScene ? 6 : 4 },
      { item: 'Wireless Microphone Kit', quantity: hasDialogue ? 2 : 1 },
      { item: 'Boom Microphone', quantity: hasDialogue ? 1 : 0 },
      { item: 'Steadicam / Gimbal', quantity: 1 },
      { item: 'DJI Drone', quantity: hasDroneShot ? 1 : 0, note: hasDroneShot ? 'Required for aerial shots' : undefined },
      { item: 'Monitor / On-set Display', quantity: 1 },
      { item: 'Teleprompter', quantity: hasDialogue ? 1 : 0 },
      { item: 'Color Grading Workstation', quantity: 1 },
      { item: 'External SSD Storage (4TB)', quantity: 2 },
    ].filter((e) => e.quantity > 0);

    const shootDays = Math.max(1, Math.ceil(scenes / 6));
    const preProductionDays = Math.max(3, Math.ceil(shootDays * 0.5));
    const postProductionDays = Math.max(5, Math.ceil(shootDays * 1.5));

    const schedule = {
      preProduction: `${preProductionDays} day${preProductionDays > 1 ? 's' : ''}`,
      production: `${shootDays} day${shootDays > 1 ? 's' : ''}`,
      postProduction: `${postProductionDays} day${postProductionDays > 1 ? 's' : ''}`,
      totalEstimate: `${preProductionDays + shootDays + postProductionDays} days`,
    };

    const warnings: string[] = [];
    if (hasNightScene) warnings.push('Night scenes detected — budget for extra lighting and generator rental.');
    if (hasDroneShot) warnings.push('Drone shots detected — ensure licensed drone pilot and location permits.');
    if (hasActionScene) warnings.push('Action sequences detected — consider stunt coordinator and insurance coverage.');

    res.json({
      success: true,
      analysis: {
        wordCount: words,
        estimatedScenes: scenes,
        projectType: projectType ?? 'general',
        crewList: crewList.filter((c) => c.priority !== 'optional' || hasDroneShot),
        equipmentList,
        schedule,
        warnings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to analyze script' });
  }
};

/**
 * AI Smart Scheduling
 * Suggests optimal crew assignment based on availability and past performance.
 */
export const getSmartScheduleSuggestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requiredRoles, projectDate, durationDays } = req.body as {
      requiredRoles: string[];
      projectDate: string;
      durationDays: number;
    };

    if (!requiredRoles?.length || !projectDate) {
      res.status(400).json({ success: false, message: 'requiredRoles and projectDate are required' });
      return;
    }

    const availableCrew = await User.find({
      role: 'crew',
      isActive: true,
      isApproved: true,
      availability: 'available',
    })
      .select('fullName position department bio availability assignedProjects')
      .lean();

    const suggestions = requiredRoles.map((role) => {
      const matches = availableCrew.filter((c) => {
        const pos = (c.position ?? '').toLowerCase();
        const dept = (c.department ?? '').toLowerCase();
        return pos.includes(role.toLowerCase()) || dept.includes(role.toLowerCase());
      });

      return {
        role,
        suggestedCrew: matches.slice(0, 3).map((c) => ({
          id: String(c._id),
          name: c.fullName,
          position: c.position,
          availability: c.availability,
          activeProjects: c.assignedProjects?.length ?? 0,
        })),
        available: matches.length,
      };
    });

    res.json({
      success: true,
      projectDate,
      durationDays: durationDays ?? 1,
      suggestions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to generate schedule suggestions' });
  }
};

/**
 * AI Contract Generator
 * Generates a draft contract based on project details.
 */
export const generateContract = async (req: Request, res: Response): Promise<void> => {
  try {
    const { contractType, clientName, crewName, projectTitle, deliverables, startDate, endDate, paymentAmount, currency } = req.body as {
      contractType: 'hire' | 'nda' | 'usage_rights' | 'service';
      clientName: string;
      crewName?: string;
      projectTitle: string;
      deliverables?: string[];
      startDate: string;
      endDate?: string;
      paymentAmount?: number;
      currency?: string;
    };

    if (!contractType || !clientName || !projectTitle) {
      res.status(400).json({ success: false, message: 'contractType, clientName, and projectTitle are required' });
      return;
    }

    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    const curr = currency ?? 'NGN';
    const deliverablesList = deliverables?.map((d, i) => `  ${i + 1}. ${d}`).join('\n') ?? '  1. Final edited video/photo deliverables\n  2. Raw footage (if applicable)';

    let contractText = '';

    if (contractType === 'hire') {
      contractText = `PANDA STUDIO — CREW HIRE AGREEMENT
Date: ${today}
Project: ${projectTitle}

PARTIES:
Client: ${clientName}
Crew Member: ${crewName ?? '[Crew Name]'}
Facilitated by: Panda Studio

1. ENGAGEMENT
The Crew Member agrees to provide professional ${crewName ? 'creative' : ''} services for the above project from ${startDate ?? '[Start Date]'} to ${endDate ?? '[End Date]'}.

2. DELIVERABLES
The following deliverables are expected upon project completion:
${deliverablesList}

3. COMPENSATION
The agreed compensation for this engagement is ${curr} ${paymentAmount?.toLocaleString() ?? '[Amount]'}, payable upon delivery and client approval.

4. INTELLECTUAL PROPERTY
All work product created under this agreement shall be the exclusive property of ${clientName} upon full payment.

5. CONFIDENTIALITY
Both parties agree to keep all project details, creative concepts, and client information strictly confidential.

6. CONDUCT
The Crew Member agrees to conduct themselves professionally at all times and adhere to Panda Studio's code of conduct.

7. CANCELLATION
Either party may cancel with 48 hours written notice. Cancellation within 24 hours of shoot date incurs a 50% cancellation fee.

SIGNATURES:
Client: ______________________ Date: __________
Crew Member: _________________ Date: __________
Panda Studio: ________________ Date: __________`;
    } else if (contractType === 'nda') {
      contractText = `PANDA STUDIO — NON-DISCLOSURE AGREEMENT
Date: ${today}
Project: ${projectTitle}

PARTIES:
Disclosing Party: ${clientName}
Receiving Party: ${crewName ?? '[Recipient Name]'}

1. CONFIDENTIAL INFORMATION
The Receiving Party agrees to hold in strict confidence all information disclosed by the Disclosing Party relating to the project "${projectTitle}", including but not limited to: creative briefs, scripts, brand strategies, unreleased content, and business plans.

2. OBLIGATIONS
The Receiving Party shall: (a) not disclose any Confidential Information to third parties; (b) use Confidential Information solely for project purposes; (c) notify the Disclosing Party immediately of any unauthorized disclosure.

3. DURATION
This NDA remains in effect for 2 years from the date of signing, or until the information enters the public domain through no fault of the Receiving Party.

4. RETURN OF MATERIALS
Upon request or project completion, all confidential materials must be returned or destroyed.

SIGNATURES:
Disclosing Party: _________________ Date: __________
Receiving Party: __________________ Date: __________`;
    } else if (contractType === 'usage_rights') {
      contractText = `PANDA STUDIO — MEDIA USAGE RIGHTS AGREEMENT
Date: ${today}
Project: ${projectTitle}

PARTIES:
Creator/Photographer/Videographer: ${crewName ?? '[Creator Name]'}
Client/Rights Holder: ${clientName}

1. GRANT OF RIGHTS
The Creator grants ${clientName} a non-exclusive, worldwide, perpetual license to use the media content produced for "${projectTitle}" for commercial and non-commercial purposes, including but not limited to: social media, broadcast, advertising, and print.

2. DELIVERABLES COVERED
${deliverablesList}

3. RESTRICTIONS
The Client may not: (a) resell or sub-license the media; (b) claim authorship; (c) alter the work in a defamatory manner.

4. CREDIT
Where practical, credit shall be given as: "Shot by ${crewName ?? '[Creator Name]'} for ${clientName} via Panda Studio."

5. COMPENSATION
${paymentAmount ? `The agreed licensing fee is ${curr} ${paymentAmount.toLocaleString()}.` : 'Compensation as per the attached service agreement.'}

SIGNATURES:
Creator: ________________________ Date: __________
Client: _________________________ Date: __________`;
    } else {
      contractText = `PANDA STUDIO — SERVICE AGREEMENT
Date: ${today}
Project: ${projectTitle}

PARTIES:
Client: ${clientName}
Service Provider: Panda Studio

1. SERVICES
Panda Studio agrees to provide the following services: ${deliverablesList}

2. TIMELINE
Services will be delivered from ${startDate ?? '[Start Date]'} to ${endDate ?? '[End Date]'}.

3. PAYMENT
Total amount: ${curr} ${paymentAmount?.toLocaleString() ?? '[Amount]'}. A 50% deposit is required to confirm booking.

4. REVISIONS
Up to 2 rounds of revisions are included. Additional revisions are billed at the standard hourly rate.

5. CANCELLATION POLICY
Cancellation with less than 72 hours notice forfeits the deposit.

SIGNATURES:
Client: ________________________ Date: __________
Panda Studio: __________________ Date: __________`;
    }

    res.json({
      success: true,
      contract: {
        type: contractType,
        title: `${contractType.replace('_', ' ').toUpperCase()} — ${projectTitle}`,
        content: contractText,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Failed to generate contract' });
  }
};
