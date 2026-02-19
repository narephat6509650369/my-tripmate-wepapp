export const tripConfirmedTemplate = (name: string) => {
  return `
    <div style="font-family: Arial, sans-serif; padding:20px;">
      <h2 style="color:#4CAF50;">🎉 Trip Confirmed!</h2>
      <p>Hello ${name},</p>
      <p>Your trip has been confirmed by the trip owner.</p>
      <p>We hope you have an amazing journey 🚀</p>
      <hr/>
      <small>TripMate Team</small>
    </div>
  `;
};

