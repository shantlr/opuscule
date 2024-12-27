import { IconGoogle8 } from '@/assets';
import { API } from '@/common/api';

export default function GoogleSignIn() {
  return (
    <>
      <button
        className="rounded border-2 gap-2 flex justify-center items-center px-4"
        onClick={() => {
          window.location.href = API.auth.google.startSSO;
        }}
      >
        <IconGoogle8 className="w-[24px]" />
        SIGN IN
      </button>
    </>
  );
}
