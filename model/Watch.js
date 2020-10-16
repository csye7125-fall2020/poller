module.exports = (sequelize, Sequelize) => {
  const watch = sequelize.define("watch", {
    watch_id: {
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    user_id: {
      type: Sequelize.UUID,
      allowNull: false,
    },
    zipcode: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  });
  return watch;
};
