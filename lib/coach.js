export const getCoachInfo = (coachGender) => {
  if (coachGender === 'male') {
    return {
      name: 'Gaddiel',
      image: '/coach-male.png'
    };
  } else {
    return {
      name: 'Devikaa',
      image: '/coach-female.png'
    };
  }
};