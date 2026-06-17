export const formatearNumero = (numero) => {
    if (numero === undefined || numero === null) return "0";
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

export const formatearPeriodo = (periodo) => {
    const periodoStr = periodo.toString();
    if (periodoStr.length === 6) {
        return `${periodoStr.substring(0, 4)}-${periodoStr.substring(4, 6)}`;
    }
    return periodoStr;
};
