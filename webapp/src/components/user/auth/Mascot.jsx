import React from 'react';
import mascot from '/src/assets/images/mascot.png';

function Mascot() {
  return (
    <div className="auth-mascot-wrapper">
        <img src={mascot} alt="Mascot Penguin" />
    </div>
  );
}

export default Mascot;