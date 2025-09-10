export const getStatusBadgeVariant = (status?: string) => {
  switch (status) {
    case 'NEW':
      return 'secondary';
    case 'READY':
      return 'default';
    case 'RUNNING':
      return 'default';
    case 'COMPLETED':
      return 'secondary';
    case 'FAILED':
      return 'destructive';
    default:
      return 'outline';
  }
};

export const getStatusBadgeClasses = (status?: string) => {
  switch (status) {
    case 'NEW':
      return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
    case 'READY':
      return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
    case 'RUNNING':
      return 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200';
    case 'COMPLETED':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200';
    case 'FAILED':
      return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
  }
};

export const mapLegacyStatus = (status?: string): 'NEW' | 'READY' | 'RUNNING' | 'COMPLETED' | 'FAILED' => {
  switch (status) {
    case 'NEW':
      return 'NEW';
    case 'READY':
      return 'READY';
    case 'RUNNING':
      return 'RUNNING';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'FAILED':
      return 'FAILED';
    default:
      return 'NEW';
  }
};
