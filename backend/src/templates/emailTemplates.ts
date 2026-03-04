// backend/src/templates/emailTemplates.ts

const baseTemplate = (content: string) => {
  return `
    <div style="
      font-family: Arial, sans-serif;
      background-color:#f4f6f8;
      padding:20px;
    ">
      <div style="
        max-width:600px;
        margin:auto;
        background:white;
        padding:20px;
        border-radius:8px;
        box-shadow:0 2px 8px rgba(0,0,0,0.05);
      ">
        ${content}

        <hr style="margin-top:20px"/>
        <p style="font-size:12px;color:#888;">
          TripMate Team 🚀
        </p>
      </div>
    </div>
  `;
};

export const tripCompletedTemplate = (name: string) => {
  return baseTemplate(`
    <h2 style="color:#4CAF50;">🎉 Trip Completed</h2>

    <p>Hello ${name},</p>

    <p>
      All members have finished voting.
      Your trip is now officially completed.
    </p>

    <p>
      You can now view the final summary in TripMate.
    </p>
  `);
};

export const joinRequestTemplate = (ownerName: string,requesterName: string) => {
  return baseTemplate(`
    <h2 style="color:#2196F3;">📥 New Join Request</h2>

    <p>Hello ${ownerName},</p>

    <p>
      <b>${requesterName}</b> has requested to join your trip.
    </p>

    <p>
      Please review and approve or reject the request in TripMate.
    </p>
  `);
};

export const joinApprovedTemplate = (name: string, tripName: string) => {
  return baseTemplate(`
    <h2 style="color:#4CAF50;">✅ Request Approved</h2>

    <p>Hello ${name},</p>

    <p>
      Your request to join <b>${tripName ?? 'the trip'}</b> has been approved.
    </p>

    <p>
      You are now officially a member of the trip 🎉
    </p>
  `);
};

export const joinRejectedTemplate = (name: string, tripName: string) => {
  return baseTemplate(`
    <h2 style="color:#f44336;">❌ Request Rejected</h2>

    <p>Hello ${name},</p>

    <p>
      Unfortunately, your request to join <b>${tripName ?? 'the trip'}</b> has been rejected by the trip owner.
    </p>

    <p>
      You may try joining another trip.
    </p>
  `);
};

export const tripConfirmedTemplate = (name: string) => {
  return baseTemplate(`
    <h2 style="color:#4CAF50;">🎉 Trip Confirmed!</h2>

    <p>Hello ${name},</p>

    <p>Your trip has been confirmed by the trip owner.</p>

    <p>We hope you have an amazing journey 🚀</p>
  `);
};


export const tripArchivedTemplate = (name: string) => {
  return baseTemplate(`
    <h2 style="color:#9e9e9e;">📦 Trip Archived</h2>

    <p>Hello ${name},</p>

    <p>
      This trip has been archived because it was inactive for 7 days.
    </p>

    <p>
      Archived trips are kept for reference and cannot be modified.
    </p>

    <p>
      You can still view trip details anytime in TripMate.
    </p>
  `);
};
