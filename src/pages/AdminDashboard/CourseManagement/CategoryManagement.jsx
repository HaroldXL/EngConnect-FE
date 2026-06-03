import { useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  AddCircle,
  Folder2,
  MinimalisticMagnifier,
  Pen,
  TrashBinMinimalistic,
} from "@solar-icons/react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Pagination,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Skeleton,
  addToast,
} from "@heroui/react";
import { useTranslation } from "react-i18next";
import { useThemeColors } from "../../../hooks/useThemeColors";
import useInputStyles from "../../../hooks/useInputStyles";
import useTableStyles from "../../../hooks/useTableStyles";
import { motion } from "framer-motion";
import { coursesApi } from "../../../api";
import { Tag } from "@solar-icons/react/ssr";

const CategoryManagement = () => {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const { inputClassNames } = useInputStyles();
  const { tableCardStyle, tableClassNames } = useTableStyles();

  const pageSize = 10;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");

  // Create/Edit modal
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [editingCategory, setEditingCategory] = useState(null);
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formType, setFormType] = useState("");

  // Delete modal
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const queryClient = useQueryClient();

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: catData, isLoading: loading } = useQuery({
    queryKey: ["admin-categories", page, pageSize, debouncedSearch, typeFilter],
    queryFn: () => {
      const params = { page, "page-size": pageSize };
      if (debouncedSearch) params["search-term"] = debouncedSearch;
      if (typeFilter) params["type"] = typeFilter;
      return coursesApi.getCategories(params).then((r) => r.data);
    },
    placeholderData: keepPreviousData,
    staleTime: 30 * 1000,
  });

  const categories = catData?.items ?? [];
  const totalPages = catData?.totalPages ?? 1;
  const totalCount = catData?.totalItems ?? 0;

  const saveMutation = useMutation({
    mutationFn: ({ id, data }) =>
      id
        ? coursesApi.updateCategory(id, data)
        : coursesApi.createCategory(data),
    onSuccess: (_, { id }) => {
      addToast({
        title: id
          ? t("adminDashboard.categories.updateSuccess")
          : t("adminDashboard.categories.createSuccess"),
        color: "success",
      });
      onClose();
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (_, { id }) => {
      addToast({
        title: id
          ? t("adminDashboard.categories.updateFailed")
          : t("adminDashboard.categories.createFailed"),
        color: "danger",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => coursesApi.deleteCategory(id),
    onSuccess: () => {
      addToast({
        title: t("adminDashboard.categories.deleteSuccess"),
        color: "success",
      });
      onDeleteClose();
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: () => {
      addToast({
        title: t("adminDashboard.categories.deleteFailed"),
        color: "danger",
      });
    },
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString(
      i18n.language === "vi" ? "vi-VN" : "en-US",
      { year: "numeric", month: "short", day: "numeric" },
    );
  };

  // Open create modal
  const handleCreate = () => {
    setEditingCategory(null);
    setFormName("");
    setFormDescription("");
    setFormType("Purpose");
    onOpen();
  };

  // Open edit modal
  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormName(category.name || "");
    setFormDescription(category.description || "");
    setFormType(category.type || "");
    onOpen();
  };

  const handleSave = () => {
    if (!formName.trim()) return;
    saveMutation.mutate({
      id: editingCategory?.id ?? null,
      data: {
        name: formName.trim(),
        description: formDescription.trim(),
        type: formType.trim(),
      },
    });
  };

  const handleDeleteClick = (category) => {
    setCategoryToDelete(category);
    onDeleteOpen();
  };

  const handleDeleteConfirm = () => {
    if (!categoryToDelete) return;
    deleteMutation.mutate(categoryToDelete.id);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1
            className="text-2xl lg:text-3xl font-bold mb-1"
            style={{ color: colors.text.primary }}
          >
            {t("adminDashboard.categories.title")}
          </h1>
          <p style={{ color: colors.text.secondary }}>
            {t("adminDashboard.categories.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            startContent={
              <AddCircle weight="BoldDuotone" className="w-4 h-4" />
            }
            style={{
              backgroundColor: colors.primary.main,
              color: colors.text.white,
            }}
            onPress={handleCreate}
          >
            {t("adminDashboard.categories.addCategory")}
          </Button>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <Card
            shadow="none"
            className="border-none"
            style={{ backgroundColor: colors.background.light }}
          >
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: colors.background.primaryLight }}
                >
                  <Folder2
                    className="w-5 h-5"
                    weight="BoldDuotone"
                    style={{ color: colors.primary.main }}
                  />
                </div>
                <div>
                  <p
                    className="text-xl font-bold"
                    style={{ color: colors.text.primary }}
                  >
                    {totalCount.toLocaleString()}
                  </p>
                  <p
                    className="text-xs"
                    style={{ color: colors.text.secondary }}
                  >
                    {t("adminDashboard.categories.totalCategories")}
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </motion.div>
      </div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Card
          shadow="none"
          className="border-none"
          style={{ backgroundColor: colors.background.light }}
        >
          <CardBody className="p-4 space-y-3">
            <Input
              type="text"
              placeholder={t("adminDashboard.categories.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              startContent={
                <MinimalisticMagnifier
                  weight="BoldDuotone"
                  className="w-4 h-4"
                  style={{ color: colors.text.secondary }}
                />
              }
              classNames={inputClassNames}
            />
            <div className="flex gap-2">
              {["", "Skill", "Purpose"].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setTypeFilter(type);
                    setPage(1);
                  }}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                  style={{
                    backgroundColor:
                      typeFilter === type
                        ? colors.primary.main
                        : colors.background.gray,
                    color:
                      typeFilter === type
                        ? colors.text.white
                        : colors.text.secondary,
                  }}
                >
                  {type === ""
                    ? t("adminDashboard.categories.filterAll")
                    : type}
                </button>
              ))}
            </div>
          </CardBody>
        </Card>
      </motion.div>

      {/* Categories Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15 }}
      >
        <Card shadow="none" className="border-none" style={tableCardStyle}>
          <CardBody className="p-0">
            {loading ? (
              <div className="p-4 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/5 rounded-lg" />
                      <Skeleton className="h-3 w-1/4 rounded-lg" />
                    </div>
                    <Skeleton className="h-4 w-24 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-20">
                <p style={{ color: colors.text.secondary }}>
                  {t("adminDashboard.categories.noData")}
                </p>
              </div>
            ) : (
              <Table
                aria-label="Categories table"
                classNames={tableClassNames}
                bottomContent={
                  totalPages > 1 ? (
                    <div className="flex w-full justify-center py-4">
                      <Pagination
                        isCompact
                        showControls
                        showShadow
                        color="primary"
                        page={page}
                        total={totalPages}
                        onChange={(p) => setPage(p)}
                      />
                    </div>
                  ) : null
                }
              >
                <TableHeader>
                  <TableColumn>
                    {t("adminDashboard.categories.table.name")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.categories.table.description")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.categories.table.type")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.categories.table.createdAt")}
                  </TableColumn>
                  <TableColumn>
                    {t("adminDashboard.categories.table.actions")}
                  </TableColumn>
                </TableHeader>
                <TableBody>
                  {categories.map((cat) => (
                    <TableRow key={cat.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Tag
                            weight="BoldDuotone"
                            className="w-4 h-4 flex-shrink-0"
                            style={{ color: colors.primary.main }}
                          />
                          <span
                            className="font-medium"
                            style={{ color: colors.text.primary }}
                          >
                            {cat.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-sm line-clamp-2"
                          style={{ color: colors.text.secondary }}
                        >
                          {cat.description || "—"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {cat.type ? (
                          <Chip size="sm" variant="flat">
                            {cat.type}
                          </Chip>
                        ) : (
                          <span style={{ color: colors.text.secondary }}>
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span
                          className="text-sm"
                          style={{ color: colors.text.secondary }}
                        >
                          {formatDate(cat.createdAt)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => handleEdit(cat)}
                          >
                            <Pen
                              weight="BoldDuotone"
                              className="w-4 h-4"
                              style={{ color: colors.primary.main }}
                            />
                          </Button>
                          <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => handleDeleteClick(cat)}
                          >
                            <TrashBinMinimalistic
                              weight="BoldDuotone"
                              className="w-4 h-4"
                              style={{ color: colors.state.error }}
                            />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardBody>
        </Card>
      </motion.div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {editingCategory
                  ? t("adminDashboard.categories.editCategory")
                  : t("adminDashboard.categories.addCategory")}
              </ModalHeader>
              <ModalBody>
                <div className="space-y-4">
                  <Input
                    label={t("adminDashboard.categories.form.name")}
                    placeholder={t(
                      "adminDashboard.categories.form.namePlaceholder",
                    )}
                    value={formName}
                    onValueChange={setFormName}
                    classNames={inputClassNames}
                    isRequired
                  />
                  <Input
                    label={t("adminDashboard.categories.form.description")}
                    placeholder={t(
                      "adminDashboard.categories.form.descriptionPlaceholder",
                    )}
                    value={formDescription}
                    onValueChange={setFormDescription}
                    classNames={inputClassNames}
                  />
                  <Select
                    label={t("adminDashboard.categories.form.type")}
                    selectedKeys={formType ? [formType] : ["Purpose"]}
                    onSelectionChange={(keys) =>
                      setFormType(Array.from(keys)[0] ?? "Purpose")
                    }
                    classNames={inputClassNames}
                  >
                    <SelectItem key="Purpose">Purpose</SelectItem>
                    <SelectItem key="Skill">Skill</SelectItem>
                  </Select>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={onClose}
                  isDisabled={saveMutation.isPending}
                >
                  {t("adminDashboard.categories.cancel")}
                </Button>
                <Button
                  style={{
                    backgroundColor: colors.primary.main,
                    color: colors.text.white,
                  }}
                  onPress={handleSave}
                  isLoading={saveMutation.isPending}
                  isDisabled={!formName.trim()}
                >
                  {t("adminDashboard.categories.save")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteOpen} onClose={onDeleteClose} size="sm">
        <ModalContent style={{ backgroundColor: colors.background.light }}>
          {(onClose) => (
            <>
              <ModalHeader style={{ color: colors.text.primary }}>
                {t("adminDashboard.categories.confirmDelete")}
              </ModalHeader>
              <ModalBody>
                <p style={{ color: colors.text.secondary }}>
                  {t("adminDashboard.categories.confirmDeleteMsg")}
                </p>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="light"
                  onPress={onClose}
                  isDisabled={deleteMutation.isPending}
                >
                  {t("adminDashboard.categories.cancel")}
                </Button>
                <Button
                  color="danger"
                  onPress={handleDeleteConfirm}
                  isLoading={deleteMutation.isPending}
                >
                  {t("adminDashboard.categories.delete")}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default CategoryManagement;
